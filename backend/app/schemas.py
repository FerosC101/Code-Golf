from pydantic import BaseModel, Field, field_validator

from app.game.scoring import validate_scoring


class CreateRoomIn(BaseModel):
    name: str = Field(default="Game Night", max_length=80)
    scoring: list[int] | None = None

    @field_validator("scoring")
    @classmethod
    def _scoring(cls, v: list[int] | None) -> list[int] | None:
        return None if v is None else validate_scoring(v)


class UpdateRoomIn(BaseModel):
    name: str | None = Field(default=None, max_length=80)
    scoring: list[int] | None = None

    @field_validator("scoring")
    @classmethod
    def _scoring(cls, v: list[int] | None) -> list[int] | None:
        return None if v is None else validate_scoring(v)


class JoinIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)


class TestCaseIn(BaseModel):
    input: str = Field(default="", max_length=20_000)
    expected_output: str = Field(default="", max_length=20_000)
    hidden: bool = True


class RoundIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=4000)
    original_code: str = Field(default="", max_length=20_000)
    duration_seconds: int = Field(default=300, ge=30, le=3600)
    tests: list[TestCaseIn] = Field(default_factory=list, max_length=50)


class CodeIn(BaseModel):
    code: str = Field(max_length=20_000)
