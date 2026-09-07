"""
Splits loaded document blocks into embedding-ready chunks.
Tries to respect natural text boundaries (paragraphs > lines > sentences)
before ever falling back to a hard character cutoff.
"""

SEPARATORS = ["\n\n", "\n", ". ", " "]

DEFAULT_CHUNK_SIZE_TOKENS = 500
DEFAULT_OVERLAP_TOKENS = 75


def estimate_tokens(text: str) -> int:
    """Rough proxy (~4 chars/token). Not exact to Gemini's tokenizer, but
    consistent — which is all chunk sizing actually needs."""
    return max(1, len(text) // 4)


def _split_by_length(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Last-resort hard cutoff — used only when no separator could break
    a piece down further (e.g. one giant unbroken line)."""
    chunk_size_chars = chunk_size * 4
    overlap_chars = overlap * 4
    step = max(1, chunk_size_chars - overlap_chars)
    return [text[i:i + chunk_size_chars] for i in range(0, len(text), step)]


def _merge_splits(splits: list[str], separator: str, chunk_size: int, overlap: int) -> list[str]:
    """Greedily packs small pieces (e.g. individual sentences) back together
    up to chunk_size, carrying the tail of one chunk into the start of the
    next so context isn't lost right at the boundary."""
    chunks = []
    current: list[str] = []
    current_len = 0

    for s in splits:
        s_len = estimate_tokens(s)

        if current_len + s_len > chunk_size and current:
            chunks.append(separator.join(current))

            # build the overlap: walk backwards from the end of the chunk
            # we just closed, taking pieces until we hit `overlap` tokens
            overlap_part: list[str] = []
            overlap_len = 0
            for piece in reversed(current):
                piece_len = estimate_tokens(piece)
                if overlap_len + piece_len > overlap:
                    if not overlap_part:
                        # guarantee at least one piece of overlap even if
                        # it alone exceeds the target — zero overlap at a
                        # boundary is worse than a slightly oversized one
                        overlap_part.insert(0, piece)
                        overlap_len += piece_len
                    break
                overlap_part.insert(0, piece)
                overlap_len += piece_len

            current = overlap_part
            current_len = overlap_len

        current.append(s)
        current_len += s_len

    if current:
        chunks.append(separator.join(current))

    return chunks

def _recursive_split(text: str, separators: list[str], chunk_size: int, overlap: int) -> list[str]:
    if estimate_tokens(text) <= chunk_size:
        return [text]

    if not separators:
        return _split_by_length(text, chunk_size, overlap)

    separator, remaining_separators = separators[0], separators[1:]
    pieces = text.split(separator)

    final_chunks = []
    good_pieces: list[str] = []

    for piece in pieces:
        if estimate_tokens(piece) < chunk_size:
            good_pieces.append(piece)
        else:
            # this single piece is still too big — flush what we've
            # accumulated so far, then recurse into the oversized piece
            # with the next separator down the hierarchy
            if good_pieces:
                final_chunks.extend(_merge_splits(good_pieces, separator, chunk_size, overlap))
                good_pieces = []
            final_chunks.extend(_recursive_split(piece, remaining_separators, chunk_size, overlap))

    if good_pieces:
        final_chunks.extend(_merge_splits(good_pieces, separator, chunk_size, overlap))

    return final_chunks


def chunk_blocks(
    blocks: list[dict],
    chunk_size_tokens: int = DEFAULT_CHUNK_SIZE_TOKENS,
    overlap_tokens: int = DEFAULT_OVERLAP_TOKENS,
) -> list[dict]:
    """
    Takes the output of loaders.load_document() and returns embedding-ready
    chunks. Each block (a page, or a whole docx/txt) is chunked independently
    of the others — this keeps page-level metadata accurate for PDFs, at the
    minor cost of not merging very short adjacent pages into one chunk.
    """
    chunks = []

    for block in blocks:
        pieces = _recursive_split(block["text"], SEPARATORS, chunk_size_tokens, overlap_tokens)

        for i, piece in enumerate(pieces):
            piece = piece.strip()
            if not piece:
                continue
            chunks.append({
                "text": piece,
                "metadata": {
                    **block["metadata"],
                    "chunk_index": i,
                    "token_count": estimate_tokens(piece),
                },
            })

    return chunks