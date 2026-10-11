"""Atomic bulk posting of journal entries."""
from django.db import transaction
from rest_framework.exceptions import ValidationError
from ..serializers import JournalEntrySerializer

def create_entries(*, items, context):
    if not isinstance(items, list) or not items:
        raise ValidationError({"detail": "Send a non-empty JSON list of entries."})
    saved = []
    with transaction.atomic():
        for index, item in enumerate(items, start=1):
            serializer = JournalEntrySerializer(data=item, context=context)
            if not serializer.is_valid():
                raise ValidationError({"item": index, "errors": serializer.errors})
            saved.append(serializer.save())
    return saved
