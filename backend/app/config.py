import json
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CG_", env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://codegolf:codegolf@localhost:5432/codegolf"
    # How long startup keeps retrying an unreachable database before giving up.
    db_connect_wait_seconds: float = 120.0
    executor_url: str = "http://localhost:8001"
    executor_token: str = "dev-executor-token"
    # Comma-separated ("https://a.app,https://b.app") or a JSON list.
    cors_origins: str = "http://localhost:5173"
    # e.g. r"https://codegolf(-[a-z0-9-]+)?\.vercel\.app" to allow Vercel preview deploys.
    cors_origin_regex: str | None = None

    # Seconds between "start round" and the problem going live (3-2-1 screen).
    countdown_seconds: int = 4
    # Network slack for submissions that were sent right before the buzzer.
    submit_grace_seconds: float = 1.0
    # Max seconds to wait for in-flight judging once a round locks.
    lock_drain_seconds: float = 20.0
    max_code_chars: int = 10_000
    test_time_limit: float = 2.0
    max_players_per_room: int = 64


    @field_validator("database_url")
    @classmethod
    def _async_driver(cls, v: str) -> str:
        # Render/Heroku-style URLs → the asyncpg driver SQLAlchemy needs.
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+asyncpg://" + v[len(prefix) :]
        return v

    @field_validator("executor_url")
    @classmethod
    def _scheme(cls, v: str) -> str:
        # Render's private-service "hostport" has no scheme.
        return v if "://" in v else f"http://{v}"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if raw.startswith("["):
            return [str(o).rstrip("/") for o in json.loads(raw)]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
