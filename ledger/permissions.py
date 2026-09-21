from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """Read (GET) for owner and shared officers. Write only for the book owner."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if hasattr(view, "get_book"):  # views inside /books/{id}/...
            return view.get_book().owner_id == request.user.id
        return True  # creating a new book: anyone logged in

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # Resolve the book that owns this object
        book = obj if hasattr(obj, "owner_id") else getattr(obj, "book", None)
        if book is None and hasattr(obj, "entry"):  # a journal line
            book = obj.entry.book
        return book is not None and book.owner_id == request.user.id
