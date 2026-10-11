"""HTTP endpoints only. Business operations live in services and ai_service."""
import logging
from openai import APIError, RateLimitError
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from . import importers
from .common import BookScopedMixin, parse_date_param, visible_books, xlsx_response
from .models import Account, BookMember, JournalEntry
from .permissions import IsAccountCreatorOrReadOnly, IsOwnerOrReadOnly
from .serializers import AccountSerializer, BookMemberSerializer, BookSerializer, JournalEntrySerializer
from .services import accounts, imports, journals, reports
from .ai_service.drafts import generate_draft

logger = logging.getLogger(__name__)

class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return visible_books(self.request.user).order_by("id")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class MemberViewSet(BookScopedMixin, mixins.CreateModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    owner_only = True
    serializer_class = BookMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BookMember.objects.filter(book=self.get_book()).select_related("user")

    def perform_create(self, serializer):
        serializer.save(book=self.get_book())

class AccountViewSet(BookScopedMixin, viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated, IsAccountCreatorOrReadOnly]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        if self.action == "list":
            queryset = Account.objects.all()
        elif "book_id" in self.kwargs:
            queryset = Account.objects.filter(book=self.get_book())
        else:
            queryset = Account.objects.all()
        if self.request.query_params.get("created_by") == "me":
            queryset = queryset.filter(created_by=self.request.user)
        return queryset.select_related("created_by").order_by("id")

    def perform_create(self, serializer):
        serializer.save(book=self.get_book(), created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def ledger(self, request, book_id=None, pk=None):
        account = self.get_object()
        data = reports.account_ledger(
            account=account, book=self.get_book(),
            date_from=parse_date_param(request, "from"),
            date_to=parse_date_param(request, "to"),
        )
        data["account"] = AccountSerializer(account, context=self.get_serializer_context()).data
        return Response(data)

    @action(detail=False, methods=["get"], url_path="trial-balance")
    def trial_balance(self, request, book_id=None):
        return Response(reports.trial_balance(book=self.get_book(), date_to=parse_date_param(request, "to")))

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create_accounts(self, request, book_id=None):
        created = accounts.create_accounts(items=request.data, context=self.get_serializer_context())
        return Response(AccountSerializer(created, many=True, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="ledgers")
    def all_ledgers(self, request, book_id=None):
        return Response(reports.all_ledgers(book=self.get_book(), date_from=parse_date_param(request, "from"), date_to=parse_date_param(request, "to")))

    @action(detail=False, methods=["get"], url_path="cash-flow")
    def cash_flow(self, request, book_id=None):
        return Response(reports.cash_flow(book=self.get_book(), date_from=parse_date_param(request, "from"), date_to=parse_date_param(request, "to")))

    @action(detail=False, methods=["get"], url_path="profit-loss")
    def profit_loss(self, request, book_id=None):
        return Response(reports.profit_loss(book=self.get_book(), date_from=parse_date_param(request, "from"), date_to=parse_date_param(request, "to")))

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser, FormParser])
    def import_excel(self, request, book_id=None):
        try:
            file = importers.get_uploaded_file(request)
        except importers.ExcelFormatError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        result = imports.import_accounts(uploaded_file=file, context=self.get_serializer_context(), dry_run=request.query_params.get("dry_run") == "true")
        if "imported" in result:
            result["accounts"] = AccountSerializer(result["accounts"], many=True, context=self.get_serializer_context()).data
        return Response(result, status=status.HTTP_201_CREATED if "imported" in result else status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="import-template")
    def import_template(self, request, book_id=None):
        return xlsx_response(importers.build_template("accounts"), "accounts_template.xlsx")

class JournalEntryViewSet(BookScopedMixin, mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return JournalEntry.objects.filter(book=self.get_book()).prefetch_related("lines__account")

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create_entries(self, request, book_id=None):
        saved = journals.create_entries(items=request.data, context=self.get_serializer_context())
        return Response(JournalEntrySerializer(saved, many=True, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser, FormParser])
    def import_excel(self, request, book_id=None):
        try:
            file = importers.get_uploaded_file(request)
        except importers.ExcelFormatError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        result = imports.import_journals(uploaded_file=file, context=self.get_serializer_context(), dry_run=request.query_params.get("dry_run") == "true")
        if "imported" in result:
            result["entries"] = JournalEntrySerializer(result["entries"], many=True, context=self.get_serializer_context()).data
        return Response(result, status=status.HTTP_201_CREATED if "imported" in result else status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="import-template")
    def import_template(self, request, book_id=None):
        return xlsx_response(importers.build_template("entries"), "journal_template.xlsx")

    @action(detail=False, methods=["post"], url_path="ai-draft")
    def ai_draft(self, request, book_id=None):
        try:
            return Response(generate_draft(raw_text=request.data.get("raw_text", ""), book=self.get_book(), context=self.get_serializer_context()))
        except RateLimitError as exc:
            code = getattr(exc, "code", None)
            logger.warning("AI provider 429: code=%s request_id=%s", code, getattr(exc, "request_id", None))
            if code in {"credit_balance_exhausted", "organization_usage_limit_exceeded", "organization_spend_limit_exceeded", "project_spend_limit_exceeded", "insufficient_quota"}:
                return Response({"detail": "AI usage is unavailable because the provider account has no remaining credits or has reached its spending limit.", "code": code}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response({"detail": "The AI provider temporarily rate-limited this request. Please retry shortly.", "code": code}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except APIError:
            return Response({"detail": "Could not generate an AI draft right now."}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
