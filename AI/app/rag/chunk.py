"""Split a document into chunks for embedding. Pure text: no I/O, no config.

1. Cut the document into sections at Markdown headings.
2. A section that fits is one chunk, kept exactly as written.
3. A longer section is cut into pieces -- sentences for prose, lines for tables and
   lists -- and the pieces are packed into chunks, repeating the last few whole pieces
   of one chunk at the start of the next (the overlap).

Every chunk starts with its section heading, so a chunk from the middle of
"## Refunds" still says it is about refunds.
"""

from __future__ import annotations

import re

_HEADING = re.compile(r"#{1,6}\s")
_LINE_ITEM = re.compile(r"(\||[-*]\s|\d+[.)]\s)")    # table row or list item
_SENTENCE_END = re.compile(r"(?<=[.!?؟])\s+")


def _sections(text: str) -> list[tuple[str, str]]:
    """(heading, body) pairs. Text before the first heading gets heading ''.

    A heading with nothing under it (a title right before "## Section") is kept on
    top of the next heading instead of being lost.
    """
    sections, heading, lines = [], "", []
    for line in text.splitlines():
        if _HEADING.match(line):
            body = "\n".join(lines).strip()
            if body:
                sections.append((heading, body))
                heading = line.strip()
            else:
                heading = f"{heading}\n{line.strip()}".strip()
            lines = []
        else:
            lines.append(line)
    body = "\n".join(lines).strip()
    if body:
        sections.append((heading, body))
    return sections


def _pieces(body: str, max_chars: int) -> list[str]:
    """Sentences for prose, one line per row for tables and lists."""
    pieces = []
    for block in re.split(r"\n\s*\n", body):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if all(_LINE_ITEM.match(line) for line in lines):
            parts = lines
        else:
            parts = _SENTENCE_END.split(" ".join(lines))
        for part in parts:
            pieces.extend(_split_long_text(part, max_chars) if len(part) > max_chars else [part])
    return pieces


def _split_long_text(text: str, max_chars: int) -> list[str]:
    """Last resort for one piece bigger than a chunk: cut at spaces, and cut a
    single word longer than a chunk (a PDF with no spaces) at max_chars."""
    words = [w[i:i + max_chars] for w in text.split() for i in range(0, len(w), max_chars)]
    return _pack(words, max_chars, 0, sep=" ")


def _overlap_tail(pieces: list[str], overlap: int, sep: str) -> list[str]:
    """The last whole pieces that fit in `overlap` characters."""
    tail: list[str] = []
    for piece in reversed(pieces):
        if len(sep.join([piece] + tail)) > overlap:
            break
        tail.insert(0, piece)
    return tail


def _pack(pieces: list[str], max_chars: int, overlap: int, sep: str = "\n") -> list[str]:
    """Greedily fill chunks with pieces, never going over max_chars."""
    chunks: list[str] = []
    current: list[str] = []
    for piece in pieces:
        if current and len(sep.join(current + [piece])) > max_chars:
            chunks.append(sep.join(current))
            current = _overlap_tail(current, overlap, sep)
            # The overlap must never stop the next piece from fitting.
            while current and len(sep.join(current + [piece])) > max_chars:
                current.pop(0)
        current.append(piece)
    if current:
        chunks.append(sep.join(current))
    return chunks


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Chunks of at most chunk_size characters, each starting with its heading."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap must not be negative")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []
    for heading, body in _sections(text):
        heading = heading[: chunk_size // 2]          # a heading may not eat the chunk
        prefix = f"{heading}\n\n" if heading else ""
        room = chunk_size - len(prefix)
        if len(body) <= room:
            chunks.append(prefix + body)
        else:
            chunks.extend(prefix + part for part in _pack(_pieces(body, room), room, overlap))
    return chunks
