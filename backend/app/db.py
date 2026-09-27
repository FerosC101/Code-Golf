from collections.abc import AsyncIterator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


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


async def create_tables() -> None:
    from app import models  # noqa: F401  (register models)

    assert _engine is not None
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def dispose_engine() -> None:
    if _engine is not None:
        await _engine.dispose()


def session() -> AsyncSession:
    assert _sessionmaker is not None, "init_engine() was not called"
    return _sessionmaker()


async def get_session() -> AsyncIterator[AsyncSession]:
    async with session() as s:
        yield s
