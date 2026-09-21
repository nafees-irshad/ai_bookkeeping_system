from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, BookViewSet, JournalEntryViewSet, MemberViewSet

books_router = DefaultRouter()
books_router.register("books", BookViewSet, basename="book")

book_router = DefaultRouter()
book_router.register("accounts", AccountViewSet, basename="account")
book_router.register("journal-entries", JournalEntryViewSet, basename="journal-entry")
book_router.register("members", MemberViewSet, basename="member")

urlpatterns = [
    path("", include(books_router.urls)),
    path("books/<int:book_id>/", include(book_router.urls)),
]