"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createChartOfAccount, CreateChartOfAccountData } from "@/lib/api/chartsOfAccountApi";
import { getBooks, Book } from "@/lib/api/booksApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { getActiveBookId, setActiveBookId, setActiveBookName } from "@/lib/books/activeBook";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "liability", label: "Liability" },
  { value: "asset", label: "Asset" },
  { value: "expense", label: "Expense" },
  { value: "equity", label: "Equity" },
  { value: "income", label: "Income" },
];

export default function AddAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("liability");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load books and set active book
  useEffect(() => {
    const initBooks = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoadingBooks(true);
        const data = await getBooks(token);
        const list: Book[] = Array.isArray(data) ? data : ((data as any)?.results ?? []);
        setBooks(list);

        if (list.length > 0) {
          // Check URL query param first
          const queryBookId = searchParams.get("bookId");
          const parsedQuery = queryBookId ? Number(queryBookId) : null;

          // Check localStorage
          const savedBookId = getActiveBookId();

          let targetBook = list.find((b) => b.id === parsedQuery);
          if (!targetBook) {
            targetBook = list.find((b) => b.id === savedBookId);
          }
          if (!targetBook) {
            targetBook = list[0];
          }

          setSelectedBookId(targetBook.id);
          setActiveBookId(targetBook.id);
          setActiveBookName(targetBook.name);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load books.");
      } finally {
        setLoadingBooks(false);
      }
    };

    initBooks();
  }, [router, searchParams]);

  const handleBookChange = (id: number) => {
    setSelectedBookId(id);
    setActiveBookId(id);
    const chosen = books.find((b) => b.id === id);
    if (chosen) {
      setActiveBookName(chosen.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      setError("Please select a book first.");
      return;
    }

    if (!code.trim()) {
      setError("Account Code is required.");
      return;
    }

    if (!name.trim()) {
      setError("Account Name is required.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const payload: CreateChartOfAccountData = {
      code: code.trim(),
      name: name.trim(),
      type: type.toLowerCase(),
    };

    try {
      setSubmitting(true);
      setError(null);
      await createChartOfAccount(selectedBookId, payload, token);
      setSuccess(true);
      setTimeout(() => {
        router.push("/accounts");
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-gabarito">
          Add Account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">
          Create a new chart of account entry
        </p>
      </div>

      {/* Book Selector / Context Banner */}
      {books.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Active Book:
            </span>
            <select
              value={selectedBookId || ""}
              onChange={(e) => handleBookChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.currency})
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/accounts"
            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← View all accounts
          </Link>
        </div>
      )}

      {/* No Books Warning */}
      {!loadingBooks && books.length === 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="text-sm font-semibold">You don't have any accounting books yet.</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Please create a book first before adding chart of accounts.
          </p>
          <Link
            href="/books/new"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition"
          >
            Create New Book
          </Link>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Account created successfully! Redirecting...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Code */}
          <div>
            <label
              htmlFor="accountCode"
              className="block text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1.5 font-gabarito"
            >
              Account Code
            </label>
            <input
              id="accountCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1001"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Account Name */}
          <div>
            <label
              htmlFor="accountName"
              className="block text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1.5 font-gabarito"
            >
              Account Name
            </label>
            <input
              id="accountName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Repairs & Maintenance Payable"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Account Type */}
          <div>
            <label
              htmlFor="accountType"
              className="block text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1.5 font-gabarito"
            >
              Account Type
            </label>
            <div className="relative">
              <select
                id="accountType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push("/accounts")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedBookId}
              className="inline-flex items-center justify-center rounded-xl bg-[#6537eb] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5629da] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
