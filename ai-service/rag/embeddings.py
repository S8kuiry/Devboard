"""
Gemini embedding client for RAG. Batches requests and retries on failure —
both matter because ingestion can mean embedding hundreds of chunks per
document, and a single dropped chunk fails silently at retrieval time,
not at ingestion time.
"""

import os
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "gemini-embedding-2")
OUTPUT_DIMENSIONS = int(os.environ.get("EMBEDDING_DIMENSION", "1536"))  # must match the Pinecone index dimension exactly
BATCH_SIZE = 40
MAX_RETRIES = 3

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("EMBEDDING_API_KEY")
        if not api_key:
            raise RuntimeError("EMBEDDING_API_KEY environment variable is not set")
        _client = genai.Client(api_key=api_key)
    return _client



def _embed_batch(texts: list[str]) -> list[list[float]]:
    client = _get_client()
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            contents = [
                types.Content(
                    parts=[
                        types.Part.from_text(text=text)
                    ]
                )
                for text in texts
            ]

            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=contents,
                config=types.EmbedContentConfig(
                    output_dimensionality=OUTPUT_DIMENSIONS
                ),
            )

            vectors = [embedding.values for embedding in response.embeddings]

            if len(vectors) != len(texts):
                raise RuntimeError(
                    f"Gemini returned {len(vectors)} embeddings "
                    f"for {len(texts)} input texts"
                )

            return vectors

        except Exception as e:
            last_error = e
            time.sleep(2 ** attempt)

    raise RuntimeError(
        f"Embedding failed after {MAX_RETRIES} retries: {last_error}"
    )




def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embeds a list of strings, batching under the hood. This is the
    function both ingestion (chunks) and retrieval (a single query) call —
    keeping one code path means query and document vectors are guaranteed
    to be produced identically."""
    all_vectors: list[list[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        all_vectors.extend(_embed_batch(batch))
    return all_vectors




def embed_chunks(chunks: list[dict]) -> list[dict]:
    texts = [c["text"] for c in chunks]

    print(f"Chunks sent for embedding: {len(chunks)}")

    vectors = embed_texts(texts)

    print(f"Embeddings returned: {len(vectors)}")

    if len(vectors) != len(chunks):
        raise RuntimeError(
            f"Embedding count mismatch: "
            f"{len(chunks)} chunks but {len(vectors)} vectors"
        )

    for chunk, vector in zip(chunks, vectors):
        chunk["embedding"] = vector

    missing = [
        i for i, chunk in enumerate(chunks)
        if "embedding" not in chunk
    ]

    if missing:
        raise RuntimeError(
            f"Embeddings missing from chunk indexes: {missing}"
        )

    print("All chunks successfully received embeddings")

    return chunks