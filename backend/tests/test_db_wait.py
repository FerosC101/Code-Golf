import time

import pytest

from app import db


async def test_startup_retries_then_gives_up_on_unreachable_db():
    # Nothing listens on port 1: every attempt is refused.
    db.init_engine("postgresql+asyncpg://u:p@127.0.0.1:1/x")
    start = time.monotonic()
    with pytest.raises(OSError):
        await db.create_tables(wait_seconds=2.5)
    assert 1.5 < time.monotonic() - start < 6  # retried rather than dying instantly
    await db.dispose_engine()
