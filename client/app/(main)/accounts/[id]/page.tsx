"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getChartOfAccount, ChartOfAccount } from "@/lib/api/chartsOfAccountApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { getActiveBookId } from "@/lib/books/activeBook";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = Number(params?.id);

  const [account, setAccount] = useState<ChartOfAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!accountId || Number.isNaN(accountId)) {
      setError("Invalid account ID.");
      setLoading(false);
      return;
    }

    const bookId = getActiveBookId();
    if (!bookId) {
      setError("No active book selected.");
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
      const data = await getChartOfAccount(bookId, accountId, token);
      setAccount(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load account details.");
    } finally {
      setLoading(false);
    }
  }, [accountId, router]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* Breadcrumb / Back */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
        <Link href="/accounts" className="hover:text-indigo-600 transition">
          Chart of Accounts
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800 dark:text-zinc-200">
          {account ? `${account.code} - ${account.name}` : "Account Detail"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-gabarito">
            {account ? account.name : "Account Details"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">
            Account Code: <span className="font-semibold text-slate-800 dark:text-zinc-200">{account?.code}</span>
          </p>
        </div>
        <Link
          href="/accounts"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          ← Back to Accounts
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {/* Account Card */}
      {!loading && account && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-900/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Type</span>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-lg bg-[#f3f0ff] px-3 py-1 text-xs font-semibold text-[#7c3aed] capitalize">
                  {account.type}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-900/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Normal Side</span>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-lg bg-[#f3f0ff] px-3 py-1 text-xs font-semibold text-[#7c3aed] capitalize">
                  {account.normal_side}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-900/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</span>
              <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {account.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-900/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cash Account</span>
              <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {account.is_cash ? "Yes (Cash/Bank)" : "No"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
