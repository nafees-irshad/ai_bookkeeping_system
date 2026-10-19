"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  getAllLedgers,
  type AccountLedger,
} from "@/lib/api/ledgersApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function typeLabel(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TAccountCard({
  ledger,
  currency,
}: {
  ledger: AccountLedger;
  currency: string;
}) {
  const creditNormal = ["liability", "equity", "income", "revenue"].includes(
    ledger.type.toLowerCase(),
  );
  const debitRows = ledger.rows.filter((row) => row.debit > 0);
  const creditRows = ledger.rows.filter((row) => row.credit > 0);
  const openingCents = toCents(Math.abs(ledger.opening_balance));
  const openingOnDebit =
    ledger.opening_balance >= 0 ? !creditNormal : creditNormal;
  const debitTotalCents =
    ledger.rows.reduce((sum, row) => sum + toCents(row.debit), 0) +
    (openingOnDebit ? openingCents : 0);
  const creditTotalCents =
    ledger.rows.reduce((sum, row) => sum + toCents(row.credit), 0) +
    (!openingOnDebit ? openingCents : 0);
  const balanceCents = Math.abs(debitTotalCents - creditTotalCents);
  const balanceOnDebit = debitTotalCents < creditTotalCents;
  const totalCents = Math.max(debitTotalCents, creditTotalCents);

  const getSideRows = (side: "debit" | "credit"): ReactNode[] => {
    const transactions = side === "debit" ? debitRows : creditRows;
    const includesOpening = openingCents > 0 &&
      (side === "debit" ? openingOnDebit : !openingOnDebit);
    const includesBalance = balanceCents > 0 &&
      (side === "debit" ? balanceOnDebit : !balanceOnDebit);
    const rows: ReactNode[] = [];

    if (includesOpening) {
      rows.push(
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-dashed border-slate-300 px-3 py-3 text-sm dark:border-zinc-700">
          <span className="font-semibold text-slate-700 dark:text-zinc-300">Balance b/d</span>
          <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
            {formatAmount(openingCents / 100, currency)}
          </span>
        </div>,
      );
    }
    for (const row of transactions) {
      rows.push(
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-dashed border-slate-300 px-3 py-3 text-sm dark:border-zinc-700">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-zinc-100" title={row.description}>
              {row.description || row.reference || `Entry #${row.entry_no}`}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              {row.date} · Entry #{row.entry_no}{row.reference ? ` · Ref: ${row.reference}` : ""}
            </p>
          </div>
          <span className={`whitespace-nowrap font-semibold tabular-nums ${
            side === "debit"
              ? "text-violet-800 dark:text-violet-300"
              : "text-slate-800 dark:text-zinc-200"
          }`}>
            {formatAmount(row[side], currency)}
          </span>
        </div>,
      );
    }
    if (includesBalance) {
      rows.push(
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-dashed border-slate-300 px-3 py-3 text-sm dark:border-zinc-700">
          <span className="font-bold text-violet-800 dark:text-violet-300">Balance c/d</span>
          <span className="whitespace-nowrap font-bold tabular-nums text-violet-800 dark:text-violet-300">
            {formatAmount(balanceCents / 100, currency)}
          </span>
        </div>,
      );
    }
    return rows;
  };
  const debitSideRows = getSideRows("debit");
  const creditSideRows = getSideRows("credit");
  const sideRowCount = Math.max(debitSideRows.length, creditSideRows.length);

  return (
    <details className="group h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            {ledger.code}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-bold text-slate-900 dark:text-zinc-100">
              {ledger.name}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              {typeLabel(ledger.type)} · {ledger.rows.length} {ledger.rows.length === 1 ? "transaction" : "transactions"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Closing balance</p>
            <p className="mt-0.5 font-bold tabular-nums text-slate-900 dark:text-zinc-100">
              {formatAmount(ledger.closing_balance, currency)}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="text-lg text-slate-400 transition-transform group-open:rotate-180"
          >
            ⌄
          </span>
        </div>
      </summary>
      <div className="border-t border-slate-200 p-4 dark:border-zinc-800 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <h3 className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-2.5 text-center text-sm font-bold text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-200">
          Debit (Dr.)
        </h3>
        <h3 className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-2.5 text-center text-sm font-bold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          Credit (Cr.)
        </h3>
        {Array.from({ length: sideRowCount }, (_, index) => (
          <Fragment key={`account-row-${index}`}>
            <div className="min-w-0">
              {debitSideRows[index] ?? <div aria-hidden="true" className="min-h-16 border-b border-dashed border-slate-300 dark:border-zinc-700" />}
            </div>
            <div className="min-w-0">
              {creditSideRows[index] ?? <div aria-hidden="true" className="min-h-16 border-b border-dashed border-slate-300 dark:border-zinc-700" />}
            </div>
          </Fragment>
        ))}
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-bold text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-200">
          <span>Total Debit</span>
          <span className="whitespace-nowrap tabular-nums">{formatAmount(totalCents / 100, currency)}</span>
        </div>
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <span>Total Credit</span>
          <span className="whitespace-nowrap tabular-nums">{formatAmount(totalCents / 100, currency)}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-zinc-800">
        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
          Closing balance
        </span>
        <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-zinc-100">
          {formatAmount(ledger.closing_balance, currency)}
        </span>
      </div>
      </div>
    </details>
  );
}

export default function AllLedgers() {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [ledgers, setLedgers] = useState<AccountLedger[]>([]);
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedgers = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const activeBook = await resolveActiveBook(token);
      if (!activeBook) {
        setBook(null);
        setLedgers([]);
        setError("Create or select a book before viewing ledgers.");
        return;
      }
      setBook(activeBook);
      const result = await getAllLedgers(activeBook.id, token);
      if (!Array.isArray(result)) {
        throw new Error("The server returned an invalid ledger response.");
      }
      setLedgers(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load ledgers.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadLedgers(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadLedgers]);

  const accountTypes = Array.from(new Set(ledgers.map((ledger) => ledger.type))).sort();
  const filteredLedgers = ledgers.filter((ledger) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch =
      !query ||
      ledger.name.toLocaleLowerCase().includes(query) ||
      ledger.code.toLocaleLowerCase().includes(query);
    return matchesSearch && (accountType === "all" || ledger.type === accountType);
  });
  const totals = filteredLedgers.reduce(
    (result, ledger) => ({
      debitCents: result.debitCents + toCents(ledger.total_debit),
      creditCents: result.creditCents + toCents(ledger.total_credit),
    }),
    { debitCents: 0, creditCents: 0 },
  );
  const isBalanced = totals.debitCents === totals.creditCents;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Ledgers
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Account activity and balances{book ? ` for ${book.name}` : ""}.
          </p>
        </div>
        {!loading && !error && ledgers.length > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">
            {filteredLedgers.length} of {ledgers.length} accounts
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadLedgers()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && ledgers.length > 0 && (
        <section
          aria-labelledby="ledger-accounts-heading"
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="ledger-accounts-heading" className="font-bold text-slate-900 dark:text-zinc-100">
                Accounts
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
                Filter accounts or change how they are displayed.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-zinc-700">
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  view === "list"
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11a1.5 1.5 0 0 1 0 3h-11A1.5 1.5 0 0 1 3 4.5Zm0 5.5A1.5 1.5 0 0 1 4.5 8.5h11a1.5 1.5 0 0 1 0 3h-11A1.5 1.5 0 0 1 3 10Zm0 5.5A1.5 1.5 0 0 1 4.5 14h11a1.5 1.5 0 0 1 0 3h-11A1.5 1.5 0 0 1 3 15.5Z" />
                </svg>
                List
              </button>
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  view === "grid"
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3 3h6v6H3V3Zm8 0h6v6h-6V3ZM3 11h6v6H3v-6Zm8 0h6v6h-6v-6Z" />
                </svg>
                Grid
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="sr-only" htmlFor="ledger-account-search">Search accounts</label>
            <input
              id="ledger-account-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by account name or code"
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-violet-950"
            />
            <label className="sr-only" htmlFor="ledger-account-type">Filter by account type</label>
            <select
              id="ledger-account-type"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="all">All account types</option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>{typeLabel(type)}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!search && accountType === "all"}
              onClick={() => {
                setSearch("");
                setAccountType("all");
              }}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Clear filters
            </button>
          </div>
        </section>
      )}

      {!loading && !error && filteredLedgers.length > 0 && (
        <section
          aria-label="Ledger totals"
          className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Total debits</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {formatAmount(totals.debitCents / 100, book?.currency ?? "")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Total credits</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {formatAmount(totals.creditCents / 100, book?.currency ?? "")}
            </p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${
            isBalanced
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30"
          }`}>
            <p className={`text-sm font-medium ${
              isBalanced
                ? "text-emerald-800 dark:text-emerald-300"
                : "text-amber-800 dark:text-amber-300"
            }`}>
              Debit and credit totals
            </p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${
              isBalanced
                ? "text-emerald-900 dark:text-emerald-200"
                : "text-amber-900 dark:text-amber-200"
            }`}>
              {isBalanced ? "Balanced" : `Difference: ${formatAmount(Math.abs(totals.debitCents - totals.creditCents) / 100, book?.currency ?? "")}`}
            </p>
          </div>
        </section>
      )}

      {loading ? (
        <div
          role="status"
          aria-label="Loading ledgers"
          className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6537eb]" />
        </div>
      ) : !error && ledgers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="font-semibold text-slate-900 dark:text-zinc-100">No ledger activity yet</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Account ledgers will appear here once the book has journal activity.
          </p>
        </div>
      ) : (
        !error && (
          <div>
            {filteredLedgers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100">No matching accounts</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Try a different search or account type.
                </p>
              </div>
            ) : (
            <div className="space-y-4">
            {filteredLedgers.map((ledger) => view === "grid" ? (
              <TAccountCard
                key={ledger.code}
                ledger={ledger}
                currency={book?.currency ?? ""}
              />
            ) : (
              <details
                key={ledger.code}
                className="group h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                      {ledger.code}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-slate-900 dark:text-zinc-100">
                        {ledger.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                        {typeLabel(ledger.type)} · {ledger.rows.length} {ledger.rows.length === 1 ? "transaction" : "transactions"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Closing balance</p>
                      <p className="mt-0.5 font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                        {formatAmount(ledger.closing_balance, book?.currency ?? "")}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="text-lg text-slate-400 transition-transform group-open:rotate-180"
                    >
                      ⌄
                    </span>
                  </div>
                </summary>

                <div className="border-t border-slate-200 dark:border-zinc-800">
                  <div className="grid gap-px bg-slate-200 sm:grid-cols-3 dark:bg-zinc-800">
                    <div className="bg-white px-5 py-3 dark:bg-zinc-950">
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Opening balance</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                        {formatAmount(ledger.opening_balance, book?.currency ?? "")}
                      </p>
                    </div>
                    <div className="bg-white px-5 py-3 dark:bg-zinc-950">
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Debits</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                        {formatAmount(ledger.total_debit, book?.currency ?? "")}
                      </p>
                    </div>
                    <div className="bg-white px-5 py-3 dark:bg-zinc-950">
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Credits</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                        {formatAmount(ledger.total_credit, book?.currency ?? "")}
                      </p>
                    </div>
                  </div>

                  {ledger.rows.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                      No transactions in this period.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                          <tr>
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3">Entry</th>
                            <th className="px-5 py-3">Reference</th>
                            <th className="px-5 py-3">Details</th>
                            <th className="px-5 py-3 text-right">Debit</th>
                            <th className="px-5 py-3 text-right">Credit</th>
                            <th className="px-5 py-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {ledger.rows.map((row, index) => (
                            <tr key={`${row.entry_no}-${index}`} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/60">
                              <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-zinc-300">{row.date}</td>
                              <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800 dark:text-zinc-200">#{row.entry_no}</td>
                              <td className="px-5 py-3 text-slate-600 dark:text-zinc-300">{row.reference || "—"}</td>
                              <td className="max-w-sm truncate px-5 py-3 text-slate-600 dark:text-zinc-300" title={row.description}>{row.description}</td>
                              <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-700 dark:text-zinc-300">{formatAmount(row.debit, book?.currency ?? "")}</td>
                              <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-700 dark:text-zinc-300">{formatAmount(row.credit, book?.currency ?? "")}</td>
                              <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-zinc-100">{formatAmount(row.balance, book?.currency ?? "")}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900">
                          <tr>
                            <th colSpan={4} className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">Closing balance</th>
                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700 dark:text-zinc-300">{formatAmount(ledger.total_debit, book?.currency ?? "")}</td>
                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700 dark:text-zinc-300">{formatAmount(ledger.total_credit, book?.currency ?? "")}</td>
                            <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-zinc-100">{formatAmount(ledger.closing_balance, book?.currency ?? "")}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </details>
            ))}
            </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
