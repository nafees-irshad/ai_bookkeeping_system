
import json
from decimal import Decimal, InvalidOperation

from .models.schema import DraftBatch
from ..serializers import JournalEntrySerializer


class DraftInvalid(ValueError):
    pass


def validate_batch(raw, *, accounts, context):
    raw = raw.strip()

    if raw.startswith("```"):
        raw = raw.removeprefix("```json")
        raw = raw.removeprefix("```")
        raw = raw.removesuffix("```").strip()

    try:
        batch = DraftBatch.model_validate(
            json.loads(raw)
        )
    except Exception as exc:
        raise DraftInvalid(
            "Invalid AI JSON or schema"
        ) from exc

    account_map = {
        str(account.code): account.id
        for account in accounts
    }

    validated_entries = []

    for proposal in batch.entries:
        lines = []

        for line in proposal.lines:
            account_id = account_map.get(
                line.account_code
            )

            if account_id is None:
                raise DraftInvalid(
                    f"Unknown account: {line.account_code}"
                )

            try:
                debit = Decimal(line.debit)
                credit = Decimal(line.credit)
            except (InvalidOperation, ValueError) as exc:
                raise DraftInvalid(
                    "Invalid monetary amount"
                ) from exc

            for amount in (debit, credit):
                if (
                    not amount.is_finite()
                    or amount < 0
                    or amount.as_tuple().exponent < -2
                ):
                    raise DraftInvalid(
                        "Invalid debit or credit amount"
                    )

            if (debit > 0) == (credit > 0):
                raise DraftInvalid(
                    "Each line needs one positive side"
                )

            lines.append({
                "account": account_id,
                "debit": f"{debit:.2f}",
                "credit": f"{credit:.2f}",
                "narration": line.narration,
            })

        entry_data = {
            "date": proposal.date,
            "reference": proposal.reference,
            "description": proposal.description,
            "lines": lines,
        }

        serializer = JournalEntrySerializer(
            data=entry_data,
            context=context,
        )

        if not serializer.is_valid():
            raise DraftInvalid(
                f"Journal validation failed: "
                f"{serializer.errors}"
            )

        validated_entries.append({
            **entry_data,
            "confidence": proposal.confidence,
            "needs_review": proposal.needs_review,
            "reason": proposal.reason,
        })

    return validated_entries
