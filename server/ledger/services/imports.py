"""Excel import validation and persistence; returns data, never HTTP responses."""
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .. import importers
from ..models import Account
from ..serializers import AccountBulkSerializer, JournalEntrySerializer

def import_accounts(*, uploaded_file, context, dry_run=False):
    try:
        rows = importers.read_sheet(uploaded_file, importers.ACCOUNT_HEADERS)
    except importers.ExcelFormatError as exc:
        raise ValidationError({"detail": str(exc)}) from exc
    items, item_rows, errors = importers.parse_accounts(rows)
    if errors:
        raise ValidationError({"errors": errors})
    with transaction.atomic():
        serializer = AccountBulkSerializer(data={"accounts": items}, context=context)
        if not serializer.is_valid():
            error = serializer.errors.get("accounts")
            if isinstance(error, list) and any(isinstance(e, dict) for e in error):
                error = [{"row": item_rows[i], "errors": e} for i, e in enumerate(error) if e]
            raise ValidationError({"errors": error})
        if dry_run:
            return {"dry_run": True, "valid": True, "accounts": len(items)}
        created = serializer.save()
    return {"imported": len(created), "accounts": created}

def import_journals(*, uploaded_file, context, dry_run=False):
    try:
        rows = importers.read_sheet(uploaded_file, ["voucher_no", "date", "account_code"])
    except importers.ExcelFormatError as exc:
        raise ValidationError({"detail": str(exc)}) from exc
    code_to_id = dict(Account.objects.filter(is_active=True).values_list("code", "id"))
    entries, errors = importers.parse_entries(rows, code_to_id)
    if errors:
        raise ValidationError({"errors": errors})
    serializers = []
    for entry in entries:
        serializer = JournalEntrySerializer(data=entry["data"], context=context)
        if not serializer.is_valid():
            errors.append({"voucher": entry["voucher"], "rows": entry["rows"], "errors": serializer.errors})
        serializers.append(serializer)
    if errors:
        raise ValidationError({"errors": errors})
    if dry_run:
        return {"dry_run": True, "valid": True, "entries": len(entries)}
    with transaction.atomic():
        saved = [serializer.save() for serializer in serializers]
    return {"imported": len(saved), "entries": saved}
