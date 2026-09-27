import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import db
from app.api.practice import router as practice_router
from app.api.rooms import router as rooms_router
from app.config import Settings, get_settings
from app.executor_client import Executor, HttpExecutor
from app.game.runtime import GameRuntime
from app.game.service import GameError
from app.realtime.hub import Hub
from app.realtime.ws import router as ws_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def create_app(settings: Settings | None = None, executor: Executor | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        db.init_engine(settings.database_url)
        await db.create_tables(settings.db_connect_wait_seconds)
        ex = executor or HttpExecutor(settings.executor_url, settings.executor_token, settings.test_time_limit)
        app.state.runtime = GameRuntime(settings, ex, Hub())
        await app.state.runtime.resume()
        yield
        await app.state.runtime.shutdown()
        if isinstance(ex, HttpExecutor):
            await ex.aclose()
        await db.dispose_engine()

    app = FastAPI(title="Code Golf", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex or None,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(GameError)
    async def game_error(_: Request, exc: GameError):
        return JSONResponse({"detail": exc.message}, status_code=exc.status)

    @app.get("/api/health")
    async def health():
        return {"ok": True}

    app.include_router(rooms_router)
    app.include_router(practice_router)
    app.include_router(ws_router)
    return app


app = create_app()
