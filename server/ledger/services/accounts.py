"""Chart-of-accounts operations. HTTP handling belongs to views.py."""
from ..serializers import AccountBulkSerializer

def create_accounts(*, items, context):
    serializer = AccountBulkSerializer(data={"accounts": items}, context=context)
    serializer.is_valid(raise_exception=True)
    return serializer.save()
