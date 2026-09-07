"""
Pinecone wrapper for RAG. Namespace = plan ID, so documents from different
plans are physically isolated — no filter logic needed to prevent leakage.
"""

import os
import hashlib
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv()

PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "devboard-rag")
PINECONE_CLOUD = os.environ.get("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.environ.get("PINECONE_REGION", "us-east-1")
EMBEDDING_DIMENSIONS = 1536  # must match rag/embeddings.py's OUTPUT_DIMENSIONS

_pc = None
_index = None


def _get_client() -> Pinecone:
    global _pc
    if _pc is None:
        api_key = os.environ.get("PINECONE_API_KEY")
        if not api_key:
            raise RuntimeError("PINECONE_API_KEY environment variable is not set")
        _pc = Pinecone(api_key=api_key)
    return _pc


def _get_index():
    """Idempotent — creates the index only if it doesn't already exist,
    so this is safe to call on every cold start without side effects."""
    global _index
    if _index is None:
        pc = _get_client()
        if not pc.has_index(PINECONE_INDEX_NAME):
            pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=EMBEDDING_DIMENSIONS,
                metric="cosine",
                spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION),
            )
        _index = pc.Index(PINECONE_INDEX_NAME)
    return _index


def _make_chunk_id(chunk: dict) -> str:
    """Deterministic ID from source + page + chunk_index, so re-ingesting
    the same document overwrites old vectors instead of duplicating them."""
    meta = chunk["metadata"]
    key = f"{meta['source']}-{meta.get('page')}-{meta['chunk_index']}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


def _clean_metadata(chunk: dict) -> dict:
    """Pinecone metadata must be flat with no None values. We also fold the
    chunk text itself in here so a query returns usable content directly,
    without a second lookup against another store."""
    meta = {k: v for k, v in chunk["metadata"].items() if v is not None}
    meta["text"] = chunk["text"]
    return meta


def upsert_chunks(namespace: str, chunks: list[dict]) -> int:
    """Chunks must already have an 'embedding' key (see embeddings.embed_chunks).
    Returns the number of vectors written."""
    index = _get_index()

    vectors = [
        (_make_chunk_id(chunk), chunk["embedding"], _clean_metadata(chunk))
        for chunk in chunks
    ]

    index.upsert(vectors=vectors, namespace=namespace, batch_size=100)
    return len(vectors)


def query(namespace: str, query_vector: list[float], top_k: int = 3) -> list[dict]:
    """Returns the top_k most relevant chunks for a query vector, each with
    its similarity score, text, and metadata."""
    try:
        index = _get_index()
        results = index.query(
            vector=query_vector,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True,
        )

        return [
            {
                "id": match.id,
                "score": match.score,
                "text": match.metadata.get("text", ""),
                "metadata": {k: v for k, v in match.metadata.items() if k != "text"},
            }
            for match in results.matches
        ]
    except Exception:
        return []


def delete_document(namespace: str, source: str) -> None:
    """
    Delete all chunks belonging to one source file
    within a namespace.
    """

    try:
        index = _get_index()

        index.delete(
            filter={"source": {"$eq": source}},
            namespace=namespace,
        )

    except Exception:
        # If the namespace does not exist, there is
        # nothing to delete.
        pass

def migrate_namespace(old_namespace: str, new_namespace: str) -> int:
    """Moves every vector from old_namespace to new_namespace. Pinecone has
    no native rename, so this is fetch-then-reinsert-then-delete-original.
    Used once, when a plan is saved for the first time (draft_id -> plan_id).
    Returns the number of vectors moved."""
    index = _get_index()

    all_ids: list[str] = []
    try:
        for id_batch in index.list(namespace=old_namespace):
            for item in id_batch:
                item_id = item.id if hasattr(item, "id") else item
                if item_id:
                    all_ids.append(item_id)
    except Exception:
        return 0

    if not all_ids:
        return 0  # nothing was ever uploaded during the draft — nothing to migrate

    FETCH_BATCH = 100
    moved = 0

    for i in range(0, len(all_ids), FETCH_BATCH):
        batch_ids = all_ids[i:i + FETCH_BATCH]
        fetched = index.fetch(ids=batch_ids, namespace=old_namespace)

        vectors = [
            (vec_id, record.values, record.metadata)
            for vec_id, record in fetched.vectors.items()
        ]
        if vectors:
            index.upsert(vectors=vectors, namespace=new_namespace, batch_size=100)
            moved += len(vectors)

    try:
        index.delete(delete_all=True, namespace=old_namespace)
    except Exception:
        pass
    return moved


def delete_namespace(namespace: str) -> None:
    """Wipes every vector in a namespace in one call — used when a plan
    draft is closed without being saved, so unsaved uploads never linger."""
    try:
        index = _get_index()
        index.delete(delete_all=True, namespace=namespace)
    except Exception:
        # Pinecone errors if the namespace never existed (e.g. the user
        # closed the modal without uploading anything) — that's not a
        # real failure, just nothing to clean up.
        pass


def get_namespace_owner(namespace: str) -> str | None:
    """Peeks at one vector in a namespace to find who uploaded it.
    Returns None if the namespace has no vectors yet — nothing to own,
    so the first uploader establishes ownership by writing owner_email."""
    try:
        index = _get_index()
        for id_batch in index.list(namespace=namespace):
            if not id_batch:
                continue
            first_item = id_batch[0]
            first_id = first_item.id if hasattr(first_item, "id") else first_item
            if not first_id:
                continue
            fetched = index.fetch(ids=[first_id], namespace=namespace)
            record = fetched.vectors.get(first_id)
            if record and record.metadata:
                return record.metadata.get("owner_email")
            break
    except Exception:
        return None
    return None