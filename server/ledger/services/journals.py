"""Atomic bulk posting of journal entries."""

from django.db import transaction
from rest_framework.exceptions import ValidationError
from ..serializers import JournalEntrySerializer


def bulk_create_entries(items, context):
    results = []

    with transaction.atomic():
        for index, item in enumerate(items, start=1):
            serializer = JournalEntrySerializer(
                data=item,
                context=context,
            )

            if not serializer.is_valid():
                raise ValidationError(
                    {
                        "item": index,
                        "errors": serializer.errors,
                    }
                )

            results.append(serializer.save())

    return results
