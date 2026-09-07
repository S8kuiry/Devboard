"""
Text-extraction loaders for RAG ingestion.
Every loader returns a list of dicts: {"text": str, "metadata": {...}}
so the chunker downstream never needs to know which file type it came from.
"""

from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument
from docx.document import Document as DocxObject
from docx.oxml.ns import qn
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph



def iter_block_items(parent):
    """
    Yield each paragraph and table child of *parent*, in the order they
    actually appear in the document. Without this, python-docx's
    `doc.paragraphs` silently skips any text inside tables.
    """
    if isinstance(parent, DocxObject):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("iter_block_items: unsupported parent type")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def load_pdf(file_path: str, filename: str) -> list[dict]:
    """One entry per page, so we keep page-level citations for retrieval."""
    reader = PdfReader(file_path)
    docs = []
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if not text:
            continue  # skip blank/scanned pages rather than embedding empty text
        docs.append({
            "text": text,
            "metadata": {"source": filename, "page": page_num},
        })
    return docs



def load_docx(file_path: str, filename: str) -> list[dict]:
    """
    Walks paragraphs and tables in document order. Tables are flattened
    row-by-row with '|' separators so the semantic structure (which
    values belong to which row) survives into the embedded text — a
    plain text dump of a table's cells loses that alignment entirely.
    """
    doc = DocxDocument(file_path)
    blocks = []

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            if text:
                blocks.append(text)

        elif isinstance(block, Table):
            rows = []
            for row in block.rows:
                cells = [cell.text.strip() for cell in row.cells]
                if any(cells):
                    rows.append(" | ".join(cells))
            if rows:
                blocks.append("\n".join(rows))

    full_text = "\n\n".join(blocks)
    if not full_text.strip():
        return []

    return [{
        "text": full_text,
        "metadata": {"source": filename, "page": None},
    }]




def load_text(file_path: str, filename: str) -> list[dict]:
    text = Path(file_path).read_text(encoding="utf-8", errors="ignore").strip()
    if not text:
        return []
    return [{
        "text": text,
        "metadata": {"source": filename, "page": None},
    }]


def load_document(file_path: str, filename: str) -> list[dict]:
    """Single entry point — dispatches by extension. This is the only
    function the rest of the pipeline needs to call."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return load_pdf(file_path, filename)
    elif ext == ".docx":
        return load_docx(file_path, filename)
    elif ext in (".txt", ".md"):
        return load_text(file_path, filename)
    else:
        raise ValueError(f"Unsupported file type: {ext}")