"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createJournalEntry,
  type JournalEntry,
} from "@/lib/api/journalEntriesApi";
import {
  getBookChartOfAccounts,
  type ChartOfAccount,
} from "@/lib/api/chartsOfAccountApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";
import JournalEntryPosted from "./journal-entry-posted";
import JournalEntryDatePicker from "./journal-entry-date-picker";

interface JournalLineDraft {
  id: number;
  account: string;
  amount: string;
  narration: string;
}

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function JournalLinesPanel({
  side,
  lines,
  accounts,
  currency,
  onAdd,
  onUpdate,
  onRemove,
}: {
  side: "debit" | "credit";
  lines: JournalLineDraft[];
  accounts: ChartOfAccount[];
  currency: string;
  onAdd: () => void;
  onUpdate: (id: number, changes: Partial<JournalLineDraft>) => void;
  onRemove: (id: number) => void;
}) {
  const isDebit = side === "debit";

  return (
    <section className={`rounded-2xl border p-5 ${
      isDebit
        ? "border-violet-200 bg-violet-50/40 dark:border-violet-900/70 dark:bg-violet-950/15"
        : "border-slate-200 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-900/50"
    }`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold capitalize text-slate-900 dark:text-zinc-100">{side}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            isDebit
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}>
            {isDebit ? "DR" : "CR"}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:bg-zinc-950 dark:text-violet-300 dark:hover:bg-violet-950/50"
        >
          <span aria-hidden="true">+</span>
          Add Journal Line
        </button>
      </div>

      <div className="space-y-4">
        {lines.map((line, index) => (
          <div key={line.id} className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                {side} line {index + 1}
              </h3>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(line.id)}
                  aria-label={`Remove ${side} line ${index + 1}`}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  Remove
                </button>
              )}
            </div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Account
              <select
                value={line.account}
                onChange={(event) => onUpdate(line.id, { account: event.target.value })}
                className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Narration
              <input
                value={line.narration}
                onChange={(event) => onUpdate(line.id, { narration: event.target.value })}
                maxLength={255}
                placeholder={`Enter narration for this ${side} line`}
                className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Amount
              <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <span className="flex items-center border-r border-slate-200 px-3 text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                  {currency}
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.amount}
                  onChange={(event) => onUpdate(line.id, { amount: event.target.value })}
                  inputMode="decimal"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-right font-normal outline-none"
                />
              </div>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function NewJournalEntry() {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [date, setDate] = useState(localDateValue);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [debitLines, setDebitLines] = useState<JournalLineDraft[]>([
    { id: 0, account: "", amount: "", narration: "" },
  ]);
  const [creditLines, setCreditLines] = useState<JournalLineDraft[]>([
    { id: 1, account: "", amount: "", narration: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postedEntry, setPostedEntry] = useState<JournalEntry | null>(null);
  const nextLineId = useRef(2);

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const activeBook = await resolveActiveBook(token);
        if (!activeBook) {
          setError("Create or select a book before posting journal entries.");
          return;
        }
        setBook(activeBook);
        const bookAccounts = await getBookChartOfAccounts(activeBook.id, token);
        const activeAccounts = bookAccounts.filter((account) => account.is_active);
        setAccounts(activeAccounts);
        if (activeAccounts.length < 2) {
          setError("Add at least two active accounts to this book before posting an entry.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load journal entry form.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const debitCents = debitLines.reduce(
    (total, line) => total + Math.round((Number(line.amount) || 0) * 100),
    0,
  );
  const creditCents = creditLines.reduce(
    (total, line) => total + Math.round((Number(line.amount) || 0) * 100),
    0,
  );
  const debitValue = debitCents / 100;
  const creditValue = creditCents / 100;
  const balanced = debitCents > 0 && debitCents === creditCents;

  const updateLine = (
    setLines: React.Dispatch<React.SetStateAction<JournalLineDraft[]>>,
    id: number,
    changes: Partial<JournalLineDraft>,
  ) => {
    setLines((current) => current.map((line) =>
      line.id === id ? { ...line, ...changes } : line,
    ));
  };

  const addLine = (setLines: React.Dispatch<React.SetStateAction<JournalLineDraft[]>>) => {
    const id = nextLineId.current;
    nextLineId.current += 1;
    setLines((current) => [
      ...current,
      { id, account: "", amount: "", narration: "" },
    ]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!book) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!date || !description.trim()) {
      setError("Enter the date and description.");
      return;
    }
    const allLines = [...debitLines, ...creditLines];
    if (allLines.some((line) =>
      !line.account ||
      !/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(line.amount) ||
      Math.round(Number(line.amount) * 100) < 1
    )) {
      setError("Choose an account and enter a positive amount with no more than two decimal places for every journal line.");
      return;
    }
    if (!balanced) {
      setError("Debit and credit amounts must be equal and greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const entry = await createJournalEntry(book.id, {
        date,
        reference: reference.trim(),
        description: description.trim(),
        lines: [
          ...debitLines.map((line) => ({
            account: Number(line.account),
            debit: (Math.round(Number(line.amount) * 100) / 100).toFixed(2),
            credit: "0.00",
            narration: line.narration.trim(),
          })),
          ...creditLines.map((line) => ({
            account: Number(line.account),
            debit: "0.00",
            credit: (Math.round(Number(line.amount) * 100) / 100).toFixed(2),
            narration: line.narration.trim(),
          })),
        ],
      }, token);
      setPostedEntry(entry);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post journal entry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6537eb]" />
      </div>
    );
  }

  if (postedEntry && book) {
    return <JournalEntryPosted entry={postedEntry} currency={book.currency} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">New Journal Entry</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400" data-subtext="true">
            Create a new journal entry to record financial transactions.
          </p>
        </div>
        <Link href="/journal/entries" className="text-sm font-semibold text-[#6537eb] hover:underline dark:text-violet-400">
          View all entries
        </Link>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[0.8fr_0.8fr_1.5fr]">
          <JournalEntryDatePicker value={date} onChange={setDate} />
          <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            Reference
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              maxLength={50}
              placeholder="e.g., JV-005"
              className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={255}
              required
              rows={2}
              placeholder="Enter journal entry description..."
              className="mt-2 block w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span className="mt-1 block text-right text-xs font-normal text-slate-400">{description.length}/255</span>
          </label>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <JournalLinesPanel
            side="debit"
            lines={debitLines}
            accounts={accounts}
            currency={book?.currency ?? "—"}
            onAdd={() => addLine(setDebitLines)}
            onUpdate={(id, changes) => updateLine(setDebitLines, id, changes)}
            onRemove={(id) => setDebitLines((current) => current.filter((line) => line.id !== id))}
          />
          <JournalLinesPanel
            side="credit"
            lines={creditLines}
            accounts={accounts}
            currency={book?.currency ?? "—"}
            onAdd={() => addLine(setCreditLines)}
            onUpdate={(id, changes) => updateLine(setCreditLines, id, changes)}
            onRemove={(id) => setCreditLines((current) => current.filter((line) => line.id !== id))}
          />
        </div>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">Total Debit</p>
              <p className="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-300">{debitValue.toFixed(2)} <span className="text-sm font-medium">{book?.currency}</span></p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">Total Credit</p>
              <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-zinc-200">{creditValue.toFixed(2)} <span className="text-sm font-medium">{book?.currency}</span></p>
            </div>
          </div>
          <p className={`text-sm font-semibold ${balanced ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
            {balanced ? "Balanced — debits equal credits" : "Enter matching debit and credit amounts"}
          </p>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting || !book || accounts.length < 2} className="inline-flex items-center gap-2 rounded-lg bg-[#6537eb] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5629da] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Posting..." : "Post Entry"}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </div>
  );
}
