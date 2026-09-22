import json
import logging
import os
from datetime import date

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, ValidationError


logger = logging.getLogger(__name__)


class ProposedLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_code: str = Field(
        description="Account code copied exactly from the provided chart of accounts"
    )
    debit: str = Field(description="Non-negative decimal amount, exactly two places")
    credit: str = Field(description="Non-negative decimal amount, exactly two places")
    narration: str = Field(description="Line narration; use an empty string when absent")


class ProposedEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str = Field(description="YYYY-MM-DD")
    reference: str = Field(description="Reference; use an empty string when absent")
    description: str
    lines: list[ProposedLine]
    confidence: float = Field(ge=0, le=1)
    needs_review: bool
    reason: str


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def _client():
    """Build an OpenAI-compatible client that sends requests to OpenRouter."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured.")

    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=api_key,
        default_headers={"X-OpenRouter-Title": "Bookkeeping System"},
    )


def propose_transaction(*, raw_text, book, accounts):
    account_list = [
        {
            "id": account.id,
            "code": account.code,
            "name": account.name,
            "type": account.type,
            "is_cash": account.is_cash,
        }
        for account in accounts
    ]

    instructions = f"""
You are an accounting-draft assistant.

Convert the raw transaction into one proposed double-entry journal entry.
Today is {date.today().isoformat()}.
The book currency is {book.currency}.

Rules:
- Use ONLY account codes in the supplied chart of accounts.
- Put the selected code in account_code exactly as supplied. Never use an account ID.
- Create at least two journal lines.
- Debit total must equal credit total.
- Amounts must be non-negative strings with exactly two decimal places.
- Never invent a transaction amount, date, or account.
- If details are unclear, set needs_review=true and confidence below 0.70.
- Still make the best safe proposal when possible.
- This is a DRAFT only; do not claim it has been posted.

Chart of accounts:
{json.dumps(account_list)}
"""

    completion = _client().chat.completions.create(
        model=os.getenv("OPENROUTER_MODEL", "openrouter/free"),
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": raw_text},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "accounting_draft",
                "strict": True,
                "schema": ProposedEntry.model_json_schema(),
            },
        },
        extra_body={"provider": {"require_parameters": True}},
    )
    message = completion.choices[0].message
    if message.refusal:
        raise ValueError("AI declined to create a transaction draft.")
    if not message.content:
        raise ValueError("AI returned an empty transaction draft.")

    try:
        proposal = ProposedEntry.model_validate_json(message.content)
    except ValidationError:
        logger.warning("OpenRouter returned an invalid draft: %r", message.content)
        raise ValueError("AI returned a draft in an invalid format. Please retry.")

    account_ids = {str(account.code): account.id for account in accounts}
    lines = []
    for line in proposal.lines:
        account_id = account_ids.get(line.account_code)
        if account_id is None:
            logger.warning("OpenRouter returned an unknown account code: %r", line.account_code)
            raise ValueError("AI selected an account that is not in this book. Please retry.")
        lines.append(
            {
                "account": account_id,
                "debit": line.debit,
                "credit": line.credit,
                "narration": line.narration,
            }
        )

    result = proposal.model_dump(exclude={"lines"})
    result["lines"] = lines
    return result
