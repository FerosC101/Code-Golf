import asyncio
import logging
import time
from collections.abc import AsyncIterator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


log = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def init_engine(url: str) -> AsyncEngine:
    global _engine, _sessionmaker
    kwargs = {} if url.startswith("sqlite") else {"pool_pre_ping": True, "pool_size": 10}
    _engine = create_async_engine(url, **kwargs)
    if url.startswith("sqlite"):
        # SQLite ignores ON DELETE CASCADE unless asked nicely.
        @event.listens_for(_engine.sync_engine, "connect")
        def _fk_on(dbapi_conn, _record):  # pragma: no cover - dev/test only
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


async def create_tables(wait_seconds: float = 0) -> None:
    """Create tables, retrying while the database is still coming up.

    On platforms like Render the database and the app can boot at the same
    time; without this the first deploy dies with "connection refused"."""
    from app import models  # noqa: F401  (register models)

    assert _engine is not None
    deadline = time.monotonic() + wait_seconds
    delay = 1.0
    while True:
        try:
            async with _engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            return
        except (OSError, ConnectionError) as exc:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise
            log.warning("Database not reachable yet (%s). Retrying...", exc)
            await asyncio.sleep(min(delay, remaining))
            delay = min(delay * 2, 10.0)


async def dispose_engine() -> None:
    if _engine is not None:
        await _engine.dispose()


def session() -> AsyncSession:
    assert _sessionmaker is not None, "init_engine() was not called"
    return _sessionmaker()


async def get_session() -> AsyncIterator[AsyncSession]:
    async with session() as s:
        yield s
