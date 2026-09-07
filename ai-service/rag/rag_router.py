"""
RAG endpoints: ingest, query, promote a draft to a saved plan's namespace,
and discard an abandoned draft's uploads.
"""

import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from api.security import get_current_user
from . import pipeline, vector_store

router = APIRouter()

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024


class RagQueryRequest(BaseModel):
    namespace: str
    query: str
    top_k: int = 3


class RagSaveRequest(BaseModel):
    draft_id: str
    plan_id: str

class RagDeleteRequest(BaseModel):
    namespace: str
    source: str



def _assert_namespace_access(namespace: str, owner_email: str):
    """Rejects any operation on a namespace that already belongs to a
    different token-verified user. Namespaces with no vectors yet pass
    through — the operation about to run is what establishes ownership."""
    existing_owner = vector_store.get_namespace_owner(namespace)
    if existing_owner is not None and existing_owner != owner_email:
        raise HTTPException(status_code=403, detail="You do not have access to this namespace")


@router.post("/rag/ingest")
def ingest_file(
    file: UploadFile = File(...),
    namespace: str = Form(default=""),

    owner_email: str = Depends(get_current_user),
):
    if not namespace or not namespace.strip():
        raise HTTPException(
            status_code=400,
            detail="Namespace is required and cannot be empty",
        )
    namespace = namespace.strip()
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit")
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    tmp_path = None
    try:
        _assert_namespace_access(namespace, owner_email)

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        result = pipeline.ingest_document(
            file_path=tmp_path,
            filename=file.filename,
            namespace=namespace,
            owner_email=owner_email,
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)




@router.post("/rag/save")
def promote_draft(req: RagSaveRequest, owner_email: str = Depends(get_current_user)):
    _assert_namespace_access(req.draft_id, owner_email)

    try:
        moved = vector_store.migrate_namespace(req.draft_id, req.plan_id)
        return {"chunks_migrated": moved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Namespace migration failed: {e}")


@router.delete("/rag/draft/{draft_id}")
def discard_draft(draft_id: str, owner_email: str = Depends(get_current_user)):
    _assert_namespace_access(draft_id, owner_email)

    try:
        vector_store.delete_namespace(draft_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft cleanup failed: {e}")



@router.delete("/rag/document")
def delete_document(
    req: RagDeleteRequest,
    owner_email: str = Depends(get_current_user),
):
    _assert_namespace_access(req.namespace, owner_email)

    vector_store.delete_document(
        namespace=req.namespace,
        source=req.source,
    )

    return {
        "status": "ok",
        "message": f"Deleted {req.source}",
    }