from decimal import Decimal
from django.db.models import DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework.exceptions import ValidationError
from ..models import Account, JournalLine

ZERO = Decimal("0")

def account_ledger(*, account, book, date_from=None, date_to=None):
    """Account book: every line for this account with a running balance."""

    lines = (
        JournalLine.objects.filter(
            account=account,
            entry__book=book,
        )
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

    return {
            "opening_balance": opening,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "closing_balance": balance,
            "rows": rows,
        }


def trial_balance(*, book, date_to=None):
    """Every account's debit/credit totals. Both columns must match."""
    money = DecimalField(max_digits=16, decimal_places=2)

    cond = Q(journal_lines__entry__book=book)

    if date_to:
        cond &= Q(journal_lines__entry__date__lte=date_to)

    qs = Account.objects.all().order_by("id").annotate(
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

    return {
            "rows": rows,
            "total_debit": sum_debit,
            "total_credit": sum_credit,
            "balanced": sum_debit == sum_credit,
        }


def all_ledgers(*, book, date_from=None, date_to=None):
    """Ledger of every account in the book, in one response."""

    lines = (
        JournalLine.objects.filter(entry__book=book)
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
    for acc in Account.objects.all().order_by("id"):
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
    return result


def cash_flow(*, book, date_from=None, date_to=None):
    """Cash in/out summary. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD"""

    cash_accounts = list(Account.objects.filter(is_cash=True))
    if not cash_accounts:
        raise ValidationError({"detail": "No cash accounts. Set is_cash=true on your cash/bank accounts."})

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
    return {
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


def profit_loss(*, book, date_from=None, date_to=None):
    """Profit & Loss. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD"""

    lines = JournalLine.objects.filter(
        entry__book=book,
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
    return {
            "from": date_from,
            "to": date_to,
            "income": income,
            "total_income": total_income,
            "expenses": expenses,
            "total_expenses": total_expenses,
            "net_profit": net,
            "result": "profit" if net > 0 else "loss" if net < 0 else "break-even",
        }

