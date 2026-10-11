# Ledger refactor

This package uses a **single `ledger/views.py`** containing the four original ViewSets. `ledger/services/` contains accounting/report, import, and bulk operations. `ledger/ai_service/` contains AI proposal generation and draft validation. There are no separate `account_views.py`, `book_views.py`, or `journal_views.py` modules.

## Installation

1. Back up your current `ledger/` directory and database.
2. Replace the Python source files with those in this ZIP. **Retain your existing `ledger/migrations/` directory**: it was not included in the uploaded source ZIP and is not recreated here.
3. Ensure dependencies from your project are installed, especially Django, DRF, openpyxl, openai, and pydantic.
4. From your Django project root, run `python manage.py check` and `python manage.py makemigrations --check --dry-run`.
5. Test permissions and endpoints in a disposable local database before production use: account list/create/edit/delete, all report routes, bulk posting, Excel import and dry-run, and AI draft (which should not save an entry).

## Important limitations

- Python syntax and import usage were checked statically. **Django runtime tests were not run**, because Django is not installed in the packaging environment. No claims of tested live MySQL behavior are made.
- The original model and migration state were preserved as supplied. Global account-code uniqueness at database level remains a separate migration decision.
- Existing account DELETE remains enabled as in the supplied ZIP; consider disallowing deletion for accounts with journal history and favoring deactivation.
- `JournalEntrySerializer` retains the existing atomic posting logic; the bulk-posting service handles multi-entry transactions. The view remains thin.
- Excel dry-run validates without saving. AI drafts are validated but never posted.
