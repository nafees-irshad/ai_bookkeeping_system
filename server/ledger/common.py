"""Book access and API response utilities."""
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from .models import Book

def parse_date_param(request, name):
    raw = request.query_params.get(name)
    if not raw:
        return None
    parsed = parse_date(raw)
    if parsed is None:
        raise ValidationError({name: "Use format YYYY-MM-DD."})
    return parsed

def xlsx_response(content, filename):
    response = HttpResponse(content, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response

def visible_books(user):
    return Book.objects.filter(Q(owner=user) | Q(members__user=user)).distinct()

class BookScopedMixin:
    owner_only = False

    def get_book(self):
        if not hasattr(self, "_book"):
            qs = Book.objects.filter(owner=self.request.user) if self.owner_only else visible_books(self.request.user)
            self._book = get_object_or_404(qs, pk=self.kwargs["book_id"])
        return self._book

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if "book_id" in self.kwargs:
            context["book"] = self.get_book()
        return context
