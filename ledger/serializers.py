from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from .models import Account, Book, BookMember, JournalEntry, JournalLine

User = get_user_model()


class BookSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source="owner.username", read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            "id",
            "name",
            "currency",
            "period_start",
            "period_end",
            "is_closed",
            "owner",
            "is_owner",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_is_owner(self, obj):
        return obj.owner_id == self.context["request"].user.id

    def validate_name(self, value):
        qs = Book.objects.filter(owner=self.context["request"].user, name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("You already have a book with this name.")
        return value


class BookMemberSerializer(serializers.ModelSerializer):
    username = serializers.SlugRelatedField(
        source="user", slug_field="username", queryset=User.objects.all()
    )

    class Meta:
        model = BookMember
        fields = ("id", "username", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_username(self, user):
        book = self.context["book"]
        if user.id == book.owner_id:
            raise serializers.ValidationError("The owner already has full access.")
        if BookMember.objects.filter(book=book, user=user).exists():
            raise serializers.ValidationError("Already shared with this user.")
        return user


class AccountSerializer(serializers.ModelSerializer):
    normal_side = serializers.ReadOnlyField()

    class Meta:
        model = Account
        fields = ("id", "code", "name", "type", "normal_side", "is_active", "is_cash")

    def validate_code(self, value):
        qs = Account.objects.filter(book=self.context["book"], code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This code already exists in this book.")
        return value


class AccountBulkSerializer(serializers.Serializer):
    accounts = AccountSerializer(many=True, allow_empty=False)

    def validate_accounts(self, items):
        book = self.context["book"]
        codes = [a["code"] for a in items]

        dupes = {c for c in codes if codes.count(c) > 1}
        if dupes:
            raise serializers.ValidationError(
                f"Duplicate codes in request: {', '.join(sorted(dupes))}"
            )

        existing = set(
            Account.objects.filter(book=book, code__in=codes).values_list(
                "code", flat=True
            )
        )
        if existing:
            raise serializers.ValidationError(
                f"Codes already exist in this book: {', '.join(sorted(existing))}"
            )
        return items

    @transaction.atomic
    def create(self, validated_data):
        book = self.context["book"]
        return [
            Account.objects.create(book=book, **item)
            for item in validated_data["accounts"]
        ]


class JournalLineSerializer(serializers.ModelSerializer):
    account = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.filter(is_active=True)
    )
    debit = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        required=False,
        default=Decimal("0"),
        min_value=0,
    )
    credit = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        required=False,
        default=Decimal("0"),
        min_value=0,
    )
    account_name = serializers.CharField(source="account.name", read_only=True)

    class Meta:
        model = JournalLine
        fields = ("id", "account", "account_name", "debit", "credit", "narration")


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = (
            "id",
            "entry_no",
            "date",
            "reference",
            "description",
            "lines",
            "total",
            "created_by",
            "created_at",
        )
        read_only_fields = ("id", "entry_no", "created_by", "created_at")

    def get_total(self, obj):
        return str(sum(l.debit for l in obj.lines.all()))

    def validate_date(self, value):
        book = self.context["book"]
        if book.period_start and value < book.period_start:
            raise serializers.ValidationError("Date is before the book's period start.")
        if book.period_end and value > book.period_end:
            raise serializers.ValidationError("Date is after the book's period end.")
        return value

    def validate_lines(self, lines):
        if len(lines) < 2:
            raise serializers.ValidationError("An entry needs at least two lines.")

        book = self.context["book"]
        for i, line in enumerate(lines, start=1):
            if (line["debit"] > 0) == (line["credit"] > 0):
                raise serializers.ValidationError(
                    f"Line {i}: enter either a debit or a credit (not both, not neither)."
                )
            if line["account"].book_id != book.id:
                raise serializers.ValidationError(
                    f"Line {i}: account does not belong to this book."
                )

        total_debit = sum(l["debit"] for l in lines)
        total_credit = sum(l["credit"] for l in lines)
        if total_debit != total_credit:
            raise serializers.ValidationError(
                f"Entry is not balanced: debit {total_debit} != credit {total_credit}."
            )
        return lines

    def validate(self, attrs):
        if self.context["book"].is_closed:
            raise serializers.ValidationError("This book is closed.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        lines = validated_data.pop("lines")
        book = self.context["book"]

        # Lock the book row so two simultaneous requests can't get the same number
        Book.objects.select_for_update().get(pk=book.pk)
        last = (
            JournalEntry.objects.filter(book=book).aggregate(m=Max("entry_no"))["m"]
            or 0
        )

        entry = JournalEntry.objects.create(
            book=book,
            entry_no=last + 1,
            created_by=self.context["request"].user,
            **validated_data,
        )
        JournalLine.objects.bulk_create([JournalLine(entry=entry, **l) for l in lines])
        return entry
