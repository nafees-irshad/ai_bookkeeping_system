"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getBookById, deleteBook, Book } from "@/lib/api/booksApi";
import { getAccessToken } from "@/lib/auth/tokens";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params?.id);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBook = useCallback(async () => {
    if (!bookId || Number.isNaN(bookId)) {
      setError("Invalid book ID.");
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getBookById(bookId, token);
      setBook(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load book details.");
    } finally {
      setLoading(false);
    }
  }, [bookId, router]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const handleDelete = async () => {
    if (!book) return;
    if (!window.confirm(`Are you sure you want to delete "${book.name}"?`)) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      setDeleting(true);
      await deleteBook(book.id, token);
      router.push("/books");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete book.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="h-9 w-9 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-zinc-400">Loading book details…</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl">
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mb-4 transition-colors"
        >
          ← Back to Books
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/40">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="text-base font-bold text-rose-800 dark:text-rose-200 font-gabarito">Unable to load book</h2>
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300 font-gabarito" data-subtext="true">{error || "Book not found."}</p>
          <button
            type="button"
            onClick={fetchBook}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const createdDate = book.created_at
    ? new Date(book.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Books
        </Link>
      </div>

      {/* Header Banner Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 font-gabarito">
                  {book.name}
                </h1>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  {book.currency}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    book.is_closed
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  }`}
                >
                  {book.is_closed ? "Closed" : "Active"}
                </span>
                {book.is_owner && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Owner
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">
                Book ID: #{book.id} • Created on {createdDate || "N/A"}
              </p>
            </div>
          </div>

          {/* Delete Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 shadow-xs hover:bg-rose-50 disabled:opacity-50 transition-colors dark:border-rose-900/60 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {deleting ? "Deleting…" : "Delete Book"}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Period Details */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-2">
            <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">Accounting Period</span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            {book.period_start} <span className="text-slate-400">→</span> {book.period_end}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
            Active financial tracking year
          </p>
        </div>

        {/* Currency & Financial Base */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-2">
            <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="6" x2="12" y2="18" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">Base Currency</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            {book.currency}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
            All ledger balances denominated in {book.currency}
          </p>
        </div>

        {/* Owner */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-2">
            <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">Book Owner</span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            {String(book.owner || "You")}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
            {book.is_owner ? "Full administrative ownership" : "Shared collaborator access"}
          </p>
        </div>
      </div>

      {/* Quick Navigation to Book Modules */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 font-gabarito">
          Book Modules & Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/accounts"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500"
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-gabarito">Chart of Accounts</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">Assets, liabilities, equity, revenues</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">View accounts →</span>
          </Link>

          <Link
            href="/journal/entries"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500"
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-gabarito">Journal Entries</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">Debit and credit records</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">View entries →</span>
          </Link>

          <Link
            href="/ledger/all"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500"
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-gabarito">General Ledger</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">Account transactions & running balances</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Open ledger →</span>
          </Link>

          <Link
            href="/reports/trial-balance"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500"
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-gabarito">Reports</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">Trial balance, P&L, cash flow</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">View reports →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
