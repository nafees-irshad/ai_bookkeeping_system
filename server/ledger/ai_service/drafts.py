from rest_framework.exceptions import ValidationError

from ..models import Account
from .fallback import generate_with_fallback
from .prompts import build_messages


def generate_draft(*, raw_text, book, context):
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValidationError({"raw_text": ["This field is required."]})

    raw_text = raw_text.strip()

    if len(raw_text) > 5000:
        raise ValidationError({"raw_text": ["Maximum 5000 characters."]})

    if book.is_closed:
        raise ValidationError({"detail": "This book is closed."})

    # Globally shared Chart of Accounts
    accounts = list(Account.objects.filter(is_active=True).order_by("code"))

    if not accounts:
        raise ValidationError({"detail": "No active accounts available."})

    messages = build_messages(
        raw_text=raw_text,
        book=book,
        accounts=accounts,
    )

    entries, model = generate_with_fallback(
        messages=messages,
        accounts=accounts,
        context=context,
    )

    return {
        "drafts": [
            {
                "date": entry["date"],
                "reference": entry["reference"],
                "description": entry["description"],
                "lines": entry["lines"],
            }
            for entry in entries
        ],
        "count": len(entries),
        "model_used": model,
        "posted": False,
        "review": [
            {
                "index": index,
                "confidence": entry["confidence"],
                "needs_review": entry["needs_review"],
                "reason": entry["reason"],
            }
            for index, entry in enumerate(entries)
        ],
    }
