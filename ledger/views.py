from decimal import Decimal

from django.db import transaction
from django.db.models import DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.http import HttpResponse
from rest_framework.parsers import FormParser, MultiPartParser
from . import importers
import logging

from openai import APIError, RateLimitError

from .ai import propose_transaction

from .models import Account, Book, BookMember, JournalEntry, JournalLine
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    AccountBulkSerializer,
    AccountSerializer,
    BookMemberSerializer,
    BookSerializer,
    JournalEntrySerializer,
)

ZERO = Decimal("0")


def _parse_date_param(request, name):
    raw = request.query_params.get(name)
    if not raw:
        return None
    parsed = parse_date(raw)
    if parsed is None:
        raise serializers.ValidationError({name: "Use format YYYY-MM-DD."})
    return parsed


def _xlsx_response(content, filename):
    resp = HttpResponse(
        content,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


def visible_books(user):
    """Books I own + books shared with me."""
    return Book.objects.filter(Q(owner=user) | Q(members__user=user)).distinct()


class BookScopedMixin:
    """Loads the book from the URL. Owner or shared officer only; others get 404."""

    owner_only = False

    def get_book(self):
        if not hasattr(self, "_book"):
            if self.owner_only:
                qs = Book.objects.filter(owner=self.request.user)
            else:
                qs = visible_books(self.request.user)
            self._book = get_object_or_404(qs, pk=self.kwargs["book_id"])
        return self._book

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["book"] = self.get_book()
        return ctx


# ---------- Books ----------
class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return visible_books(self.request.user).order_by("id")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# ---------- Sharing (owner only) ----------
class MemberViewSet(
    BookScopedMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    owner_only = True
    serializer_class = BookMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BookMember.objects.filter(book=self.get_book()).select_related("user")

    def perform_create(self, serializer):
        serializer.save(book=self.get_book())


# ---------- Accounts ----------
class AccountViewSet(BookScopedMixin, viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return Account.objects.filter(book=self.get_book())

    def perform_create(self, serializer):
        serializer.save(book=self.get_book())

    @action(detail=True, methods=["get"])
    def ledger(self, request, book_id=None, pk=None):
        """Account book: every line for this account with a running balance."""
        account = self.get_object()
        date_from = _parse_date_param(request, "from")
        date_to = _parse_date_param(request, "to")

        lines = (
            JournalLine.objects.filter(account=account)
            .select_related("entry")
            .order_by("entry__date", "entry__entry_no", "id")
        )

        sign = 1 if account.normal_side == "debit" else -1

        opening = ZERO
        if date_from:
            before = lines.filter(entry__date__lt=date_from).aggregate(
                d=Sum("debit"), c=Sum("credit")
            )
            opening = sign * ((before["d"] or ZERO) - (before["c"] or ZERO))
            lines = lines.filter(entry__date__gte=date_from)
        if date_to:
            lines = lines.filter(entry__date__lte=date_to)

        balance = opening
        total_debit = total_credit = ZERO
        rows = []
        for line in lines:
            balance += sign * (line.debit - line.credit)
            total_debit += line.debit
            total_credit += line.credit
            rows.append(
                {
                    "date": line.entry.date,
                    "entry_no": line.entry.entry_no,
                    "reference": line.entry.reference,
                    "description": line.narration or line.entry.description,
                    "debit": line.debit,
                    "credit": line.credit,
                    "balance": balance,
                }
            )

        return Response(
            {
                "account": AccountSerializer(
                    account, context=self.get_serializer_context()
                ).data,
                "opening_balance": opening,
                "total_debit": total_debit,
                "total_credit": total_credit,
                "closing_balance": balance,
                "rows": rows,
            }
        )

    @action(detail=False, methods=["get"], url_path="trial-balance")
    def trial_balance(self, request, book_id=None):
        """Every account's debit/credit totals. Both columns must match."""
        date_to = _parse_date_param(request, "to")
        money = DecimalField(max_digits=16, decimal_places=2)
        cond = Q(journal_lines__entry__date__lte=date_to) if date_to else None

        qs = self.get_queryset().annotate(
            d=Coalesce(
                Sum("journal_lines__debit", filter=cond),
                Value(ZERO),
                output_field=money,
            ),
            c=Coalesce(
                Sum("journal_lines__credit", filter=cond),
                Value(ZERO),
                output_field=money,
            ),
        )

        rows, sum_debit, sum_credit = [], ZERO, ZERO
        for acc in qs:
            net = acc.d - acc.c
            debit_bal = net if net > 0 else ZERO
            credit_bal = -net if net < 0 else ZERO
            if debit_bal == 0 and credit_bal == 0:
                continue
            sum_debit += debit_bal
            sum_credit += credit_bal
            rows.append(
                {
                    "code": acc.code,
                    "name": acc.name,
                    "type": acc.type,
                    "debit": debit_bal,
                    "credit": credit_bal,
                }
            )

        return Response(
            {
                "rows": rows,
                "total_debit": sum_debit,
                "total_credit": sum_credit,
                "balanced": sum_debit == sum_credit,
            }
        )

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create_accounts(self, request, book_id=None):
        serializer = AccountBulkSerializer(
            data={"accounts": request.data}, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        return Response(
            AccountSerializer(
                created, many=True, context=self.get_serializer_context()
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="ledgers")
    def all_ledgers(self, request, book_id=None):
        """Ledger of every account in the book, in one response."""
        date_from = _parse_date_param(request, "from")
        date_to = _parse_date_param(request, "to")

        lines = (
            JournalLine.objects.filter(account__book=self.get_book())
            .select_related("entry", "account")
            .order_by("entry__date", "entry__entry_no", "id")
        )
        if date_to:
            lines = lines.filter(entry__date__lte=date_to)

        # group lines by account
        by_account = {}
        for line in lines:
            by_account.setdefault(line.account_id, []).append(line)

        result = []
        for acc in self.get_queryset():
            sign = 1 if acc.normal_side == "debit" else -1
            opening = ZERO
            balance = ZERO
            total_debit = total_credit = ZERO
            rows = []
            for line in by_account.get(acc.id, []):
                delta = sign * (line.debit - line.credit)
                if date_from and line.entry.date < date_from:
                    opening += delta  # earlier than the range
                    balance += delta
                    continue
                balance += delta
                total_debit += line.debit
                total_credit += line.credit
                rows.append(
                    {
                        "date": line.entry.date,
                        "entry_no": line.entry.entry_no,
                        "reference": line.entry.reference,
                        "description": line.narration or line.entry.description,
                        "debit": line.debit,
                        "credit": line.credit,
                        "balance": balance,
                    }
                )
            if not rows and opening == 0:
                continue  # skip accounts with no activity
            result.append(
                {
                    "code": acc.code,
                    "name": acc.name,
                    "type": acc.type,
                    "opening_balance": opening,
                    "total_debit": total_debit,
                    "total_credit": total_credit,
                    "closing_balance": balance,
                    "rows": rows,
                }
            )
        return Response(result)

    @action(detail=False, methods=["get"], url_path="cash-flow")
    def cash_flow(self, request, book_id=None):
        """Cash in/out summary. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD"""
        book = self.get_book()
        date_from = _parse_date_param(request, "from")
        date_to = _parse_date_param(request, "to")

        cash_accounts = list(self.get_queryset().filter(is_cash=True))
        if not cash_accounts:
            return Response(
                {
                    "detail": "No cash accounts. Set is_cash=true on your cash/bank accounts."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        all_lines = JournalLine.objects.filter(entry__book=book)

        def in_period(qs):
            if date_from:
                qs = qs.filter(entry__date__gte=date_from)
            if date_to:
                qs = qs.filter(entry__date__lte=date_to)
            return qs

        # ---- per cash/bank account: opening, in, out, closing ----
        account_rows = []
        opening_total = closing_total = ZERO
        for acc in cash_accounts:
            lines = all_lines.filter(account=acc)
            opening = ZERO
            if date_from:
                b = lines.filter(entry__date__lt=date_from).aggregate(
                    d=Sum("debit"), c=Sum("credit")
                )
                opening = (b["d"] or ZERO) - (b["c"] or ZERO)
            m = in_period(lines).aggregate(d=Sum("debit"), c=Sum("credit"))
            cash_in, cash_out = m["d"] or ZERO, m["c"] or ZERO
            closing = opening + cash_in - cash_out
            opening_total += opening
            closing_total += closing
            account_rows.append(
                {
                    "code": acc.code,
                    "name": acc.name,
                    "opening": opening,
                    "in": cash_in,
                    "out": cash_out,
                    "closing": closing,
                }
            )

        # ---- counterparties: what the cash was received from / paid for ----
        entry_ids = all_lines.filter(account__in=cash_accounts).values("entry_id")
        others = (
            in_period(all_lines.filter(entry_id__in=entry_ids, account__is_cash=False))
            .values("account__code", "account__name", "account__type")
            .annotate(d=Sum("debit"), c=Sum("credit"))
            .order_by("account__code")
        )

        receipts, payments = [], []
        total_receipts = total_payments = ZERO
        for row in others:
            net = (row["c"] or ZERO) - (row["d"] or ZERO)  # credit side = cash came in
            item = {
                "code": row["account__code"],
                "name": row["account__name"],
                "type": row["account__type"],
                "amount": abs(net),
            }
            if net > 0:
                receipts.append(item)
                total_receipts += net
            elif net < 0:
                payments.append(item)
                total_payments += -net

        net_change = total_receipts - total_payments
        return Response(
            {
                "from": date_from,
                "to": date_to,
                "opening_balance": opening_total,
                "receipts": receipts,
                "total_receipts": total_receipts,
                "payments": payments,
                "total_payments": total_payments,
                "net_cash_flow": net_change,
                "closing_balance": closing_total,
                "reconciled": opening_total + net_change == closing_total,
                "cash_accounts": account_rows,
            }
        )

    @action(detail=False, methods=["get"], url_path="profit-loss")
    def profit_loss(self, request, book_id=None):
        """Profit & Loss. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD"""
        date_from = _parse_date_param(request, "from")
        date_to = _parse_date_param(request, "to")

        lines = JournalLine.objects.filter(
            account__book=self.get_book(),
            account__type__in=[Account.Type.INCOME, Account.Type.EXPENSE],
        )
        if date_from:
            lines = lines.filter(entry__date__gte=date_from)
        if date_to:
            lines = lines.filter(entry__date__lte=date_to)

        rows = (
            lines.values("account__code", "account__name", "account__type")
            .annotate(d=Sum("debit"), c=Sum("credit"))
            .order_by("account__code")
        )

        income, expenses = [], []
        total_income = total_expenses = ZERO
        for r in rows:
            d, c = r["d"] or ZERO, r["c"] or ZERO
            if r["account__type"] == Account.Type.INCOME:
                amount = c - d  # income grows with credits
                total_income += amount
                income.append(
                    {
                        "code": r["account__code"],
                        "name": r["account__name"],
                        "amount": amount,
                    }
                )
            else:
                amount = d - c  # expenses grow with debits
                total_expenses += amount
                expenses.append(
                    {
                        "code": r["account__code"],
                        "name": r["account__name"],
                        "amount": amount,
                    }
                )

        net = total_income - total_expenses
        return Response(
            {
                "from": date_from,
                "to": date_to,
                "income": income,
                "total_income": total_income,
                "expenses": expenses,
                "total_expenses": total_expenses,
                "net_profit": net,
                "result": "profit" if net > 0 else "loss" if net < 0 else "break-even",
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_excel(self, request, book_id=None):
        """Upload an .xlsx chart of accounts. Add ?dry_run=true to only validate."""
        dry_run = request.query_params.get("dry_run") == "true"
        try:
            file = importers.get_uploaded_file(request)
            rows = importers.read_sheet(file, importers.ACCOUNT_HEADERS)
        except importers.ExcelFormatError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        items, item_rows, errors = importers.parse_accounts(rows)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            s = AccountBulkSerializer(
                data={"accounts": items}, context=self.get_serializer_context()
            )
            if not s.is_valid():
                err = s.errors.get("accounts")
                if isinstance(err, list) and any(isinstance(e, dict) for e in err):
                    # per-row errors: attach the Excel row number
                    err = [
                        {"row": item_rows[i], "errors": e}
                        for i, e in enumerate(err)
                        if e
                    ]
                return Response({"errors": err}, status=status.HTTP_400_BAD_REQUEST)
            created = s.save()
            if dry_run:
                transaction.set_rollback(True)

        if dry_run:
            return Response({"dry_run": True, "valid": True, "accounts": len(items)})
        return Response(
            {
                "imported": len(created),
                "accounts": AccountSerializer(
                    created, many=True, context=self.get_serializer_context()
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="import-template")
    def import_template(self, request, book_id=None):
        return _xlsx_response(
            importers.build_template("accounts"), "accounts_template.xlsx"
        )


# ---------- Journal entries ----------
class JournalEntryViewSet(
    BookScopedMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Create, list, retrieve only. Posted entries are never edited or deleted."""

    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return JournalEntry.objects.filter(book=self.get_book()).prefetch_related(
            "lines__account"
        )

    # No perform_create: the serializer sets book, entry_no and created_by.

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create_entries(self, request, book_id=None):
        if not isinstance(request.data, list) or not request.data:
            return Response(
                {"detail": "Send a non-empty JSON list of entries."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ctx = self.get_serializer_context()
        results = []
        with transaction.atomic():
            for i, item in enumerate(request.data, start=1):
                s = JournalEntrySerializer(data=item, context=ctx)
                if not s.is_valid():
                    transaction.set_rollback(True)  # undo entries saved so far
                    return Response(
                        {"item": i, "errors": s.errors},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                results.append(s.save())

        return Response(
            JournalEntrySerializer(results, many=True, context=ctx).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_excel(self, request, book_id=None):
        """Upload an .xlsx of journal lines. Add ?dry_run=true to only validate."""
        dry_run = request.query_params.get("dry_run") == "true"
        book = self.get_book()
        try:
            file = importers.get_uploaded_file(request)
            rows = importers.read_sheet(file, ["voucher_no", "date", "account_code"])
        except importers.ExcelFormatError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        code_to_id = dict(
            Account.objects.filter(book=book, is_active=True).values_list("code", "id")
        )
        entries, errors = importers.parse_entries(rows, code_to_id)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Pass 1: validate every entry so ALL problems are reported at once
        ctx = self.get_serializer_context()
        serializers_ = []
        for e in entries:
            s = JournalEntrySerializer(data=e["data"], context=ctx)
            if not s.is_valid():
                errors.append(
                    {"voucher": e["voucher"], "rows": e["rows"], "errors": s.errors}
                )
            serializers_.append(s)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        if dry_run:
            return Response({"dry_run": True, "valid": True, "entries": len(entries)})

        # Pass 2: save all in one transaction (all or nothing)
        with transaction.atomic():
            saved = [s.save() for s in serializers_]

        return Response(
            {
                "imported": len(saved),
                "entries": JournalEntrySerializer(saved, many=True, context=ctx).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="import-template")
    def import_template(self, request, book_id=None):
        return _xlsx_response(
            importers.build_template("entries"), "journal_template.xlsx"
        )

    @action(detail=False, methods=["post"], url_path="ai-draft")
    def ai_draft(self, request, book_id=None):
        raw_text = request.data.get("raw_text", "").strip()

        if not raw_text:
            return Response(
                {"raw_text": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(raw_text) > 2_000:
            return Response(
                {"raw_text": ["Keep raw_text under 2,000 characters."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        book = self.get_book()
        if book.is_closed:
            return Response(
                {"detail": "This book is closed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accounts = Account.objects.filter(book=book, is_active=True).order_by("code")
        logger = logging.getLogger(__name__)

        try:
            proposal = propose_transaction(
                raw_text=raw_text,
                book=book,
                accounts=accounts,
            )
        except RateLimitError as exc:
            error_code = getattr(exc, "code", None)
            request_id = getattr(exc, "request_id", None)

            logger.warning(
                "AI provider 429: code=%s request_id=%s message=%s",
                error_code,
                request_id,
                str(exc),
            )

            quota_codes = {
                "credit_balance_exhausted",
                "organization_usage_limit_exceeded",
                "organization_spend_limit_exceeded",
                "project_spend_limit_exceeded",
                "insufficient_quota",
            }

            if error_code in quota_codes:
                return Response(
                    {
                        "detail": "AI usage is unavailable because the provider account has no remaining credits or has reached its spending limit.",
                        "code": error_code,
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            return Response(
                {
                    "detail": "The AI provider temporarily rate-limited this request. Please retry shortly.",
                    "code": error_code,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        except APIError:
            return Response(
                {"detail": "Could not generate an AI draft right now."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # Remove AI-only review fields before using your normal entry serializer.
        entry_data = {
            key: proposal[key] for key in ("date", "reference", "description", "lines")
        }

        serializer = JournalEntrySerializer(
            data=entry_data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)

        # Deliberately return a draft only—NO serializer.save().
        return Response(
            {
                "raw_text": raw_text,
                # Return the JSON-safe proposal, not validated_data (which contains
                # Account model instances after DRF resolves the account IDs).
                "draft": entry_data,
                "confidence": proposal["confidence"],
                "needs_review": proposal["needs_review"],
                "reason": proposal["reason"],
            }
        )
