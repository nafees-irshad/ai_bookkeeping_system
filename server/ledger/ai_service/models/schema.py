
from pydantic import BaseModel, ConfigDict, Field


class DraftLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_code: str
    debit: str
    credit: str
    narration: str = ""


class DraftEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str
    reference: str = ""
    description: str
    lines: list[DraftLine] = Field(min_length=2)

    confidence: float = Field(ge=0, le=1)
    needs_review: bool
    reason: str = ""


class DraftBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entries: list[DraftEntry] = Field(
        min_length=1,
        max_length=20,
    )
