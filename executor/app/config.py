from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EXEC_", env_file=".env", extra="ignore")

    token: str = "dev-executor-token"
    # docker: one throwaway container per job (production).
    # process: rlimited subprocess on this host (local dev only, NOT a sandbox).
    mode: str = "docker"
    sandbox_image: str = "codegolf-sandbox:latest"
    max_concurrency: int = 4
    max_time_limit: float = 5.0
    memory_mb: int = 128
    cpus: str = "0.5"
    pids_limit: int = 32
    tmpfs_mb: int = 16


@lru_cache
def get_settings() -> Settings:
    return Settings()
