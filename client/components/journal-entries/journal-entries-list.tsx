"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getJournalEntries,
  type JournalEntry,
  type JournalEntriesResponse,
} from "@/lib/api/journalEntriesApi";
import ExportJournalEntries from "./export-journal-entries";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";

function unwrapEntries(response: JournalEntriesResponse) {
  if (Array.isArray(response)) {
    return { entries: response, count: response.length, hasNext: false, hasPrevious: false };
  }
  return {
    entries: response.results,
    count: response.count,
    hasNext: response.next !== null,
    hasPrevious: response.previous !== null,
  };
}

export default function JournalEntriesList() {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (requestedPage: number, selectedBook?: Book) => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const activeBook = selectedBook ?? await resolveActiveBook(token);
      if (!activeBook) {
        setBook(null);
        setEntries([]);
        setError("Create or select a book before viewing journal entries.");
        return;
      }
      setBook(activeBook);
      const response = await getJournalEntries(activeBook.id, token, requestedPage);
      const result = unwrapEntries(response);
      setEntries(result.entries);
      setCount(result.count);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
      setPage(requestedPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPage(1);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadPage]);

  const formatAmount = (amount: string) =>
    Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Journal Entries</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400" data-subtext="true">
            Review posted transactions{book ? ` in ${book.name}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportJournalEntries book={book} />
          <Link href="/journal/new" className="rounded-lg bg-[#6537eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5629da]">
            + New journal entry
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
          <button type="button" onClick={() => void loadPage(page)} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-slate-900 dark:text-zinc-100">Posted entries</h2>
          <span className="text-sm text-slate-500 dark:text-zinc-400">{count} total</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-14"><div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6537eb]" /></div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-semibold text-slate-800 dark:text-zinc-200">No journal entries yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Post your first entry to see it here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Entry</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="transition hover:bg-slate-50/70 dark:hover:bg-zinc-900/60">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-zinc-100">#{entry.entry_no}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-zinc-300">{entry.date}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-zinc-300">{entry.reference || "—"}</td>
                      <td className="max-w-sm truncate px-5 py-4 text-slate-600 dark:text-zinc-300">{entry.description}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900 dark:text-zinc-100">
                        {formatAmount(entry.total)} {book?.currency}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/journal/entries/${entry.id}`} className="font-semibold text-[#6537eb] hover:underline dark:text-violet-400">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-zinc-800">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Page {page}</span>
              <div className="flex gap-2">
                <button type="button" disabled={!hasPrevious || loading} onClick={() => void loadPage(page - 1, book ?? undefined)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-zinc-700">Previous</button>
                <button type="button" disabled={!hasNext || loading} onClick={() => void loadPage(page + 1, book ?? undefined)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-zinc-700">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
