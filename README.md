# Financial Bookkeeping System

A double-entry bookkeeping REST API built with Django, Django REST Framework,
MySQL, JWT authentication, Excel import, and optional OpenRouter AI-assisted
journal-entry drafting.

Officers create books, define a chart of accounts, and record balanced journal
entries. Ledgers, trial balance, cash flow, and profit and loss reports are
calculated from those entries, so the reports stay consistent.

## What problems it solves

1. **Manual entry work is automated.** Record a transaction once in the journal. The ledger, trial balance, cash flow report and profit and loss statement are calculated from it, and they can never disagree with each other.
2. **Bulk entry through Excel.** Upload a spreadsheet of journal entries instead of typing them one by one, with a dry-run mode to validate before saving.
3. **Chart of accounts setup.** Add accounts one at a time, in bulk through JSON, or by Excel upload.
4. **AI-assisted entry from plain text.** Describe a transaction in plain language (e.g. *"Paid Rs 3,500 cash for office stationery today"*) and get back a ready-made, correctly classified debit/credit journal entry matched against your own chart of accounts, for you to review and post.

---

## Features

| Area | What you get |
|---|---|
| Authentication | Register, login (JWT), refresh, logout, change password, profile |
| Books | Each officer opens their own books, with an optional financial period and closing |
| Sharing | The owner can give other officers **read-only** access to a book |
| Chart of accounts | Asset, liability, equity, income and expense accounts, unique code per book |
| Journal entries | Balanced debit/credit entries with narration, sequential voucher numbers per book |
| Ledger | Per-account ledger with running balance and date filters, or all ledgers at once |
| Trial balance | Debit and credit totals per account with a balanced check |
| Cash flow | Cash and bank receipts and payments, opening and closing, with reconciliation |
| Profit and loss | Income minus expenses on an accrual basis |
| Excel import | Upload accounts and journal entries from `.xlsx`, with downloadable templates |
| AI-assisted entry | Turn a plain-text transaction description into a suggested, balanced journal entry mapped to your own chart of accounts; nothing is saved until reviewed and posted |

### Accounting rules enforced

- Total debits must equal total credits in every entry
- A line has either a debit or a credit, never both, and never a negative amount
- Money uses `DecimalField` (never floats)
- Posted entries cannot be edited or deleted (books are append-only)
- Entries must fall inside the book's period and cannot be added to a closed book
- A line can only use an account from the same book

### Access rules

| Person | Read book | Write | Manage sharing |
|---|---|---|---|
| Owner | Yes | Yes | Yes |
| Officer the book is shared with | Yes | No (403) | No (404) |
| Any other officer | 404 | 404 | 404 |

Roles: `officer` (default) and `admin` (manages users).

---

## Requirements

- Python 3.10 or newer
- MySQL 8.0.16 or newer
- Django 5.2.x
- pip and a virtual environment

For the optional AI-assisted entry feature:

- An OpenRouter account and API key
- The Python `openai` SDK. The project uses it as an OpenRouter-compatible
  client, not as an OpenAI API client.
- An available OpenRouter model. `openrouter/free` is the default and routes to
  a free model that supports the requested structured output when available.
  Free-model availability and rate limits can change.

## Installation

### 1. Create a virtual environment

```bash
cd bookkeeping_system
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
pip install openai
```

`openai` installs Pydantic, which the AI draft schema uses. If maintaining the
dependency list manually, add `openai` to `requirements.txt` before deploying.

If `mysqlclient` fails to install on Windows, upgrade pip first. Alternatively,
install `pymysql` and add the following to `config/__init__.py`:

```python
import pymysql

pymysql.install_as_MySQLdb()
```

### 3. Create the database

```sql
CREATE DATABASE bookkeeping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configure `.env`

Create `.env` in the project root, beside `manage.py`:

```ini
SECRET_KEY=your-django-secret-key
JWT_SIGNING_KEY=your-separate-jwt-key
DEBUG=True
DB_NAME=bookkeeping_db
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306

# Optional: required only for AI-assisted entry
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=openrouter/free
```

Generate Django keys with:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Run it twice: once for `SECRET_KEY` and once for `JWT_SIGNING_KEY`. Never commit
`.env` or expose an API key in client-side code. The included `.gitignore`
already excludes `.env`.

### 5. Migrate and run

```bash
python manage.py makemigrations accounts
python manage.py makemigrations ledger
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/`.

## Quick start

All URLs require a trailing slash. Except for registration and login, requests
need `Authorization: Bearer <access_token>`.

### Create a book and accounts

```http
POST /api/books/
Content-Type: application/json

{"name":"Ali Traders 2026","currency":"PKR","period_start":"2026-07-01","period_end":"2027-06-30"}
```

```http
POST /api/books/1/accounts/bulk/
Content-Type: application/json

[
  {"code":"1001","name":"Cash in Hand","type":"asset","is_cash":true},
  {"code":"1002","name":"Bank","type":"asset","is_cash":true},
  {"code":"3001","name":"Owner's Capital","type":"equity"},
  {"code":"4001","name":"Sales","type":"income"},
  {"code":"5008","name":"Office Stationery Expense","type":"expense"}
]
```

### Post a journal entry

```http
POST /api/books/1/journal-entries/
Content-Type: application/json

{
  "date":"2026-09-01",
  "reference":"V-001",
  "description":"Capital introduced",
  "lines":[
    {"account":1,"debit":"500000.00","credit":"0.00","narration":""},
    {"account":3,"debit":"0.00","credit":"500000.00","narration":""}
  ]
}
```

## AI-assisted entry

AI assistance creates a **draft only**. It never saves a journal entry by
itself. Your application must show the proposal for review and then send the
accepted draft to the normal journal-entry endpoint.

### How it works

1. Send one raw transaction description.
2. The server sends the text, book currency, current date, and this book's
   active chart of accounts to OpenRouter.
3. The model returns a strict JSON proposal containing account **codes**,
   amounts, date, description, confidence, and reason.
4. The backend confirms each returned code is in the active chart and converts
   it to the matching database account ID.
5. `JournalEntrySerializer` applies the same account, balance, date, period,
   and closed-book checks used by manually entered transactions.
6. The API returns the unsaved draft. Review it, then post it normally.

### Create a draft

```http
POST /api/books/1/journal-entries/ai-draft/
Content-Type: application/json

{"raw_text":"Paid Rs 3,500 cash for office stationery today."}
```

Example successful response:

```json
{
  "raw_text": "Paid Rs 3,500 cash for office stationery today.",
  "draft": {
    "date": "2026-09-22",
    "reference": "draft",
    "description": "Paid Rs 3,500 cash for office stationery today.",
    "lines": [
      {"account": 21, "debit": "3500.00", "credit": "0.00", "narration": "Office stationery expense"},
      {"account": 1, "debit": "0.00", "credit": "3500.00", "narration": "Paid in cash"}
    ]
  },
  "confidence": 0.95,
  "needs_review": false,
  "reason": "Stationery is an expense and cash decreases."
}
```

The `account` values in `draft.lines` are validated database IDs, suitable for
the normal entry endpoint. The model is instructed to return account codes; the
server resolves those codes and rejects unknown ones rather than creating or
guessing accounts.

### Review and post the draft

After review, post the `draft` object exactly as a normal entry:

```http
POST /api/books/1/journal-entries/
Content-Type: application/json

{
  "date": "2026-09-22",
  "reference": "draft",
  "description": "Paid Rs 3,500 cash for office stationery today.",
  "lines": [
    {"account": 21, "debit": "3500.00", "credit": "0.00", "narration": "Office stationery expense"},
    {"account": 1, "debit": "0.00", "credit": "3500.00", "narration": "Paid in cash"}
  ]
}
```

There is no `ai-post/` endpoint in this project. This deliberate separation
keeps a person in control of every posted accounting entry.

### AI troubleshooting

| Response | Meaning and action |
| --- | --- |
| `OPENROUTER_API_KEY is not configured.` | Add the key to `.env` and restart Django. |
| `429` | The selected free model/provider is temporarily rate-limited; retry later. |
| `AI returned a draft in an invalid format.` | Retry; a free model returned malformed structured output. |
| `AI selected an account that is not in this book.` | Add/correct the chart of accounts, then try again. |
| `422` validation errors for date or balance | Edit the draft before posting, or provide clearer raw text. |

## Excel import

Chart-of-accounts upload:

```text
POST /api/books/{book_id}/accounts/import/
```

Required columns: `code`, `name`, `type`.

Journal-entry upload:

```text
POST /api/books/{book_id}/journal-entries/import/
```

Required columns: `voucher_no`, `date`, `account_code`; supported optional
columns are `reference`, `description`, `debit`, `credit`, and `narration`.
Use `?dry_run=true` to validate without saving. Limits are 5 MB and 5,000 rows.

Templates:

```text
GET /api/books/{book_id}/accounts/import-template/
GET /api/books/{book_id}/journal-entries/import-template/
```

## Main API routes

| Method | URL | Purpose |
| --- | --- | --- |
| POST, GET | `/api/books/` | Create or list owned/shared books |
| POST, GET | `/api/books/{id}/accounts/` | Create or list accounts |
| POST | `/api/books/{id}/accounts/bulk/` | Bulk-create accounts |
| POST, GET | `/api/books/{id}/journal-entries/` | Post or list entries |
| POST | `/api/books/{id}/journal-entries/bulk/` | Bulk-post entries |
| POST | `/api/books/{id}/journal-entries/ai-draft/` | Generate an unsaved AI draft |
| GET | `/api/books/{id}/accounts/{aid}/ledger/` | Account ledger |
| GET | `/api/books/{id}/accounts/trial-balance/` | Trial balance |
| GET | `/api/books/{id}/accounts/cash-flow/` | Cash flow |
| GET | `/api/books/{id}/accounts/profit-loss/` | Profit and loss |

## Project structure

```text
bookkeeping_system/
├── config/       # Django configuration and root URLs
├── accounts/     # Custom user model and JWT endpoints
├── ledger/
│   ├── ai.py         # OpenRouter draft generation and account-code resolution
│   ├── models.py     # Book, Account, JournalEntry, JournalLine
│   ├── serializers.py# Entry validation, including double-entry balance
│   ├── views.py      # API endpoints and reports
│   └── importers.py  # Excel parsing and templates
├── .env
├── manage.py
└── requirements.txt
```

## Production notes

- Set `DEBUG=False`, configure `ALLOWED_HOSTS`, and serve over HTTPS.
- Keep database, JWT, Django, and OpenRouter keys outside source control.
- Treat AI output as a suggestion; require human approval before posting.
- Test the AI workflow with your own chart of accounts and representative
  transactions before using it for operational bookkeeping.
