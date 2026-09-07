"""
Orchestrates the full RAG pipeline. This is the only module the router needs
to call — it doesn't need to know anything about loaders, chunking,
embeddings, or Pinecone individually.
"""

from datetime import datetime, timezone
from . import loaders, chunking, embeddings, vector_store


def ingest_document(
    file_path: str,
    filename: str,
    namespace: str,
    owner_email: str,
) -> dict:
    """
    Ingests one file into the given namespace (a draft_id before a plan is
    saved, or the plan_id after). Returns a summary the router can hand
    straight back to the client.
    """
    blocks = loaders.load_document(file_path, filename)
    if not blocks:
        return {"filename": filename, "chunks_ingested": 0, "status": "empty_or_unreadable"}

    chunks = chunking.chunk_blocks(blocks)
    if not chunks:
        return {"filename": filename, "chunks_ingested": 0, "status": "empty_or_unreadable"}

    uploaded_at = datetime.now(timezone.utc).isoformat()
    for chunk in chunks:
        chunk["metadata"]["owner_email"] = owner_email
        chunk["metadata"]["uploaded_at"] = uploaded_at

    chunks = embeddings.embed_chunks(chunks)

    # Delete any prior version of this filename before inserting the new
    # one — protects against orphaned chunks if the re-upload has fewer
    # chunks than what it's replacing (deterministic IDs alone don't cover that).
    vector_store.delete_document(namespace, filename)

    # print(f"Chunks before Pinecone: {len(chunks)}")
    # print(f"First chunk keys: {chunks[0].keys()}")
    # print(f"Missing embeddings: {sum('embedding' not in c for c in chunks)}")

    count = vector_store.upsert_chunks(namespace, chunks)

    return {"filename": filename, "chunks_ingested": count, "status": "ok"}


def retrieve_context(namespace: str, query_text: str, top_k: int = 3) -> list[dict]:
    """
    Embeds a query and returns the top_k most relevant chunks from the
    given namespace — the read-side counterpart to ingest_document, used
    to ground the planning chat in the user's uploaded documents.
    """
    query_vector = embeddings.embed_texts([query_text])[0]
    return vector_store.query(namespace, query_vector, top_k=top_k)