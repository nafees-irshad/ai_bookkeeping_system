"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrialBalance, type TrialBalance } from "@/lib/api/reportsApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";

function formatAmount(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    throw new Error("The server returned an invalid trial balance amount.");
  }
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function typeLabel(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TrialBalanceReport() {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrialBalance = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const activeBook = await resolveActiveBook(token);
      if (!activeBook) {
        setBook(null);
        setTrialBalance(null);
        setError("Create or select a book before viewing the trial balance.");
        return;
      }
      setBook(activeBook);
      setTrialBalance(await getTrialBalance(activeBook.id, token));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load the trial balance.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTrialBalance(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTrialBalance]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Trial Balance
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Review account balances{book ? ` for ${book.name}` : ""}.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void loadTrialBalance()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div
          role="status"
          aria-label="Loading trial balance"
          className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#6537eb]" />
        </div>
      ) : trialBalance && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-slate-900 dark:text-zinc-100">Account balances</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                trialBalance.balanced
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {trialBalance.balanced ? "Balanced" : "Out of balance"}
            </span>
          </div>
          {trialBalance.rows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-semibold text-slate-800 dark:text-zinc-200">No account balances yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                Post journal entries to generate a trial balance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Account code</th>
                    <th className="px-5 py-3">Account name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Debit</th>
                    <th className="px-5 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {trialBalance.rows.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/60">
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800 dark:text-zinc-200">{row.code}</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-zinc-300">{row.name}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-400">{typeLabel(row.type)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                        {formatAmount(row.debit, book?.currency ?? "")}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                        {formatAmount(row.credit, book?.currency ?? "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900">
                  <tr>
                    <th colSpan={3} className="px-5 py-3 text-left font-bold text-slate-900 dark:text-zinc-100">Total</th>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatAmount(trialBalance.total_debit, book?.currency ?? "")}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatAmount(trialBalance.total_credit, book?.currency ?? "")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
