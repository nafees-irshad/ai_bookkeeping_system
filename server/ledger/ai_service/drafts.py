"""Generate and validate a proposal without posting it."""
from rest_framework.exceptions import ValidationError
from ..models import Account
from ..serializers import JournalEntrySerializer
from .provider import propose_transaction

def generate_draft(*, raw_text, book, context):
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValidationError({"raw_text": ["This field is required."]})
    raw_text = raw_text.strip()
    if len(raw_text) > 2_000:
        raise ValidationError({"raw_text": ["Keep raw_text under 2,000 characters."]})
    if book.is_closed:
        raise ValidationError({"detail": "This book is closed."})
    proposal = propose_transaction(raw_text=raw_text, book=book, accounts=Account.objects.filter(is_active=True).order_by("code"))
    entry_data = {key: proposal[key] for key in ("date", "reference", "description", "lines")}
    serializer = JournalEntrySerializer(data=entry_data, context=context)
    serializer.is_valid(raise_exception=True)
    return {"raw_text": raw_text, "draft": entry_data, "confidence": proposal["confidence"], "needs_review": proposal["needs_review"], "reason": proposal["reason"]}
