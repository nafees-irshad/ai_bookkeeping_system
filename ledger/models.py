from django.conf import settings
from django.db import models
from django.db.models import Q


class Book(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="books"
    )
    name = models.CharField(max_length=150)
    currency = models.CharField(max_length=3, default="PKR")
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"], name="unique_book_name_per_owner"
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.owner})"


class BookMember(models.Model):
    """An officer who has READ-ONLY access to someone else's book."""

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shared_books"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["book", "user"], name="unique_member_per_book"
            ),
        ]

    def __str__(self):
        return f"{self.user} -> {self.book}"


class Account(models.Model):
    class Type(models.TextChoices):
        ASSET = "asset", "Asset"
        LIABILITY = "liability", "Liability"
        EQUITY = "equity", "Equity"
        INCOME = "income", "Income"
        EXPENSE = "expense", "Expense"

    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="accounts")
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=150)
    type = models.CharField(max_length=20, choices=Type.choices)
    is_active = models.BooleanField(default=True)
    is_cash = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(
                fields=["book", "code"], name="unique_account_code_per_book"
            ),
        ]

    @property
    def normal_side(self):
        return (
            "debit" if self.type in (self.Type.ASSET, self.Type.EXPENSE) else "credit"
        )

    def __str__(self):
        return f"{self.code} - {self.name}"


class JournalEntry(models.Model):
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="entries")
    entry_no = models.PositiveIntegerField()
    date = models.DateField()
    reference = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="journal_entries",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-entry_no"]
        verbose_name_plural = "journal entries"
        constraints = [
            models.UniqueConstraint(
                fields=["book", "entry_no"], name="unique_entry_no_per_book"
            ),
        ]

    def __str__(self):
        return f"JV-{self.entry_no} ({self.date})"


class JournalLine(models.Model):
    entry = models.ForeignKey(
        JournalEntry, on_delete=models.CASCADE, related_name="lines"
    )
    account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="journal_lines"
    )
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    narration = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(debit__gte=0) & Q(credit__gte=0),
                name="line_amounts_non_negative",
            ),
            models.CheckConstraint(
                condition=(Q(debit__gt=0) & Q(credit=0))
                | (Q(debit=0) & Q(credit__gt=0)),
                name="line_one_side_only",
            ),
        ]
