"""Pure scoring rules. No I/O here so they're trivial to test."""

from collections.abc import Hashable, Iterable, Sequence
from typing import TypeVar

DEFAULT_SCORING: list[int] = [10, 8, 6, 5, 4, 3, 2, 1]

K = TypeVar("K", bound=Hashable)


def count_chars(code: str) -> int:
    """Every character counts: spaces, tabs and newlines included.

    CRLF is normalised to LF first so Windows users aren't penalised.
    """
    return len(normalize_code(code))


def normalize_code(code: str) -> str:
    return code.replace("\r\n", "\n").replace("\r", "\n")


def competition_rank(items: Iterable[tuple[K, int]], *, reverse: bool = False) -> list[tuple[K, int, int]]:
    """Standard competition ranking ("1224"): ties share a rank, next rank skips.

    Sorted ascending by value (fewest characters wins) unless reverse=True
    (most points wins). Returns (key, value, rank).
    """
    ordered = sorted(items, key=lambda kv: kv[1], reverse=reverse)
    ranked: list[tuple[K, int, int]] = []
    prev_value: int | None = None
    prev_rank = 0
    for index, (key, value) in enumerate(ordered, start=1):
        rank = prev_rank if value == prev_value else index
        ranked.append((key, value, rank))
        prev_value, prev_rank = value, rank
    return ranked


def points_for_rank(rank: int, scoring: Sequence[int]) -> int:
    """The last entry in the table applies to every rank beyond it."""
    if not scoring or rank < 1:
        return 0
    return scoring[min(rank, len(scoring)) - 1]


def validate_scoring(scoring: Sequence[int]) -> list[int]:
    values = [int(v) for v in scoring]
    if not 1 <= len(values) <= 50:
        raise ValueError("Scoring table needs between 1 and 50 entries")
    if any(v < 0 or v > 1000 for v in values):
        raise ValueError("Points must be between 0 and 1000")
    return values

