"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getJournalEntry, type JournalEntry } from "@/lib/api/journalEntriesApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function JournalEntryDetail() {
  const params = useParams();
  const router = useRouter();
  const entryId = Number(params?.id);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!Number.isInteger(entryId) || entryId < 1) {
        setError("Invalid journal entry ID.");
        setLoading(false);
        return;
      }
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        setError(null);
        const activeBook = await resolveActiveBook(token);
        if (!activeBook) {
          setError("Create or select a book before viewing journal entries.");
          return;
        }
        setBook(activeBook);
        const result = await getJournalEntry(activeBook.id, entryId, token);
        setEntry(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load journal entry.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [entryId, router]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6537eb]" /></div>;
  }

  if (error || !entry || !book) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/journal/entries" className="mb-4 inline-flex text-sm font-semibold text-[#6537eb] hover:underline dark:text-violet-400">← All journal entries</Link>
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error || "Journal entry not found."}</div>
      </div>
    );
  }

  const debitLines = entry.lines.filter((line) => Number(line.debit) > 0);
  const creditLines = entry.lines.filter((line) => Number(line.credit) > 0);
  const createdAt = new Date(entry.created_at);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/journal/entries" className="mb-5 inline-flex text-sm font-semibold text-[#6537eb] hover:underline dark:text-violet-400">← All journal entries</Link>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Journal Entry #{entry.entry_no}</h1>
              <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Posted</span>
            </div>
          </div>
          <Link href="/journal/new" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">New entry</Link>
        </header>

        <div className="grid gap-5 border-b border-slate-200 px-6 py-5 dark:border-zinc-800 sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p><p className="mt-1 text-sm font-medium text-slate-800 dark:text-zinc-200">{formatDate(entry.date)}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reference</p><p className="mt-1 text-sm font-medium text-slate-800 dark:text-zinc-200">{entry.reference || "—"}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p><p className="mt-1 text-sm font-medium text-slate-800 dark:text-zinc-200">{entry.description}</p></div>
        </div>

        <div className="grid sm:grid-cols-2">
          {[
            {
              heading: "Debit side",
              lines: debitLines,
              amountKey: "debit" as const,
              headingClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
              amountClass: "text-emerald-700 dark:text-emerald-300",
            },
            {
              heading: "Credit side",
              lines: creditLines,
              amountKey: "credit" as const,
              headingClass: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
              amountClass: "text-violet-700 dark:text-violet-300",
            },
          ].map((side) => (
            <section key={side.heading} className="border-b border-slate-200 last:border-b-0 sm:border-r sm:last:border-r-0 dark:border-zinc-800">
              <h2 className={`border-b border-slate-200 px-5 py-3 text-sm font-bold uppercase tracking-wide dark:border-zinc-800 ${side.headingClass}`}>{side.heading}</h2>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {side.lines.map((line) => (
                  <div key={line.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold text-slate-900 dark:text-zinc-100">{line.account_name}</p>
                      <p className={`whitespace-nowrap font-semibold ${side.amountClass}`}>{formatAmount(line[side.amountKey])} {book.currency}</p>
                    </div>
                    {line.narration && <div className="mt-3"><p className="text-xs text-slate-500 dark:text-zinc-400">Narration</p><p className="mt-1 text-sm italic text-slate-600 dark:text-zinc-300">{line.narration}</p></div>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-slate-200 px-6 py-5 dark:border-zinc-800">
          <div className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-zinc-100">
            <span>Total</span><span>{formatAmount(entry.total)} {book.currency}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
            Created on {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString()}
          </p>
        </footer>
      </article>
    </div>
  );
}
