"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAllChartOfAccounts,
  updateChartOfAccount,
  ChartOfAccount,
  UpdateChartOfAccountData,
} from "@/lib/api/chartsOfAccountApi";
import { getBooks, Book } from "@/lib/api/booksApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { getActiveBookId, setActiveBookId, setActiveBookName } from "@/lib/books/activeBook";

const TYPE_OPTIONS = [
  { value: "liability", label: "Liability" },
  { value: "asset", label: "Asset" },
  { value: "expense", label: "Expense" },
  { value: "equity", label: "Equity" },
  { value: "income", label: "Income" },
];

const ACCOUNTS_PER_PAGE = 20;
type AccountFilter = "all" | "mine";

/** Read-only visual toggle — NOT clickable */
function ReadOnlyToggle({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex h-5 w-9 shrink-0 cursor-default items-center rounded-full transition-colors ${on ? "bg-[#22c55e]" : "bg-slate-300 dark:bg-zinc-600"}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </span>
  );
}

/** Clickable toggle used inside edit modal */
function EditToggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-2 group">
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${on ? "bg-[#22c55e]" : "bg-slate-300 dark:bg-zinc-600"}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{label}</span>
    </button>
  );
}

export default function ViewAccounts() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [accountCount, setAccountCount] = useState(0);
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);
  const [eCode, setECode] = useState("");
  const [eName, setEName] = useState("");
  const [eType, setEType] = useState("");
  const [eActive, setEActive] = useState(true);
  const [eCash, setECash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eError, setEError] = useState<string | null>(null);

  // Load books
  useEffect(() => {
    (async () => {
      const token = getAccessToken();
      if (!token) { router.push("/login"); return; }
      try {
        const data = await getBooks(token);
        const list: Book[] = Array.isArray(data) ? data : ((data as any)?.results ?? []);
        if (list.length > 0) {
          const saved = getActiveBookId();
          const t = list.find((b) => b.id === saved) || list[0];
          setActiveBookId(t.id);
          setActiveBookName(t.name);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load books.");
      }
    })();
  }, [router]);

  const fetchAccounts = useCallback(async (
    requestedPage: number,
    createdByMe: boolean,
  ) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAllChartOfAccounts(token, requestedPage, createdByMe);
      if (Array.isArray(res)) {
        setAccounts(res);
        setAccountCount(res.length);
      } else {
        setAccounts(res.results);
        setAccountCount(res.count);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts(page, accountFilter === "mine");
  }, [page, accountFilter, fetchAccounts]);

  const changeAccountFilter = (filter: AccountFilter) => {
    setAccountFilter(filter);
    setPage(1);
  };

  const openEdit = (a: ChartOfAccount) => {
    setEditing(a);
    setECode(a.code);
    setEName(a.name);
    setEType(a.type);
    setEActive(a.is_active);
    setECash(a.is_cash);
    setEError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const token = getAccessToken();
    if (!token) return;
    const payload: UpdateChartOfAccountData = {
      code: eCode.trim(),
      name: eName.trim(),
      type: eType.toLowerCase(),
      is_active: eActive,
      is_cash: eCash,
    };
    try {
      setSaving(true);
      setEError(null);
      const updated = await updateChartOfAccount(editing.book_id, editing.id, payload, token);
      setAccounts((prev) => prev.map((item) => (item.id === editing.id ? updated : item)));
      setEditing(null);
    } catch (err: unknown) {
      setEError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = accounts.filter(
    (a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(accountCount / ACCOUNTS_PER_PAGE));
  const firstAccount = accountCount === 0 ? 0 : (page - 1) * ACCOUNTS_PER_PAGE + 1;
  const lastAccount = Math.min(page * ACCOUNTS_PER_PAGE, accountCount);
  const isShowingCreatedByMe = accountFilter === "mine";
  const tableColumnCount = isShowingCreatedByMe ? 9 : 6;

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-gabarito">All Accounts</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400" data-subtext="true">View and manage your chart of accounts.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/accounts/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#6537eb] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#5629da]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Account
          </Link>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1 border-b border-slate-200 dark:border-zinc-800" role="tablist" aria-label="Account views">
        {(["all", "mine"] as const).map((filter) => {
          const selected = accountFilter === filter;
          const label = filter === "all" ? "All accounts" : "Created by me";
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => changeAccountFilter(filter)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                selected
                  ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <span>{error}</span>
          <button type="button" onClick={() => fetchAccounts(page, accountFilter === "mine")} className="ml-3 font-semibold underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
          {/* Search row */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800/80">
            <div className="relative w-56">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search accounts..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 py-1.5 text-xs transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="shrink-0 text-xs text-slate-400 dark:text-zinc-500">
                {searchTerm ? `${filtered.length} shown · ` : ""}
                {accountCount} {accountCount === 1 ? "account" : "accounts"}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed border-collapse text-xs">
              <colgroup>
                {isShowingCreatedByMe ? (
                  <>
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "8%" }} />
                  </>
                ) : (
                  <>
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "34%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                  </>
                )}
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pl-4 pr-2 text-left">Code</th>
                  <th className="py-2 px-2 text-left">Name</th>
                  <th className="py-2 px-2 text-left">Type</th>
                  <th className="py-2 px-2 text-left">Normal Side</th>
                  <th className="py-2 px-2 text-center">Active</th>
                  <th className="py-2 px-2 text-center">Cash</th>
                  {isShowingCreatedByMe && (
                    <>
                      <th className="py-2 px-2 text-left">Created by</th>
                      <th className="py-2 px-2 text-left">Created at</th>
                      <th className="py-2 pl-2 pr-4 text-right">Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {/* Loading */}
                {loading && (
                  <tr><td colSpan={tableColumnCount} className="py-10 text-center text-slate-400 dark:text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"/>
                      <span>Loading...</span>
                    </div>
                  </td></tr>
                )}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={tableColumnCount} className="py-10 text-center text-slate-500 dark:text-zinc-400">
                    <p className="font-semibold text-xs">No accounts found.</p>
                    <p className="mt-1 text-xs text-slate-400">{searchTerm ? "Try a different search." : "Add your first account."}</p>
                    {!searchTerm && (
                      <Link href="/accounts/new" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#6537eb] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5629da]">+ Add Account</Link>
                    )}
                  </td></tr>
                )}

                {/* Rows */}
                {!loading && filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition">
                    <td className="py-2.5 pl-4 pr-2 font-semibold text-slate-800 dark:text-zinc-100 truncate">{acc.code}</td>
                    <td className="py-2.5 px-2 text-slate-700 dark:text-zinc-200">
                      <span className="block truncate" title={acc.name}>{acc.name}</span>
                      {acc.is_suspense && (
                        <span className="inline-block rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">Suspense</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex rounded-md bg-[#f3f0ff] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#7c3aed] dark:bg-indigo-950/70 dark:text-indigo-300">{acc.type}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex rounded-md bg-[#f3f0ff] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#7c3aed] dark:bg-indigo-950/70 dark:text-indigo-300">{acc.normal_side || "—"}</span>
                    </td>
                    {/* READ-ONLY toggles */}
                    <td className="py-2.5 px-2">
                      <div className="flex justify-center"><ReadOnlyToggle on={acc.is_active} /></div>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex justify-center"><ReadOnlyToggle on={acc.is_cash} /></div>
                    </td>
                    {isShowingCreatedByMe && (
                      <>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-zinc-300">
                          {acc.created_by_name || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 dark:text-zinc-400">
                          {new Date(acc.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 pl-2 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(acc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#7c3aed] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed] transition hover:bg-[#f5f3ff] dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {/* Placeholder dotted rows */}
                {!loading && filtered.length > 0 && filtered.length < 3 &&
                  [...Array(3 - filtered.length)].map((_, i) => (
                    <tr key={`ph-${i}`} className="text-[10px] text-slate-200 select-none dark:text-zinc-800">
                      {[...Array(tableColumnCount)].map((_, j) => (
                        <td key={j} className="py-3 px-2 font-mono">{j !== 1 ? "· · · · · ·" : ""}</td>
                      ))}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {accountCount > ACCOUNTS_PER_PAGE && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-zinc-800/80">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Showing {firstAccount}–{lastAccount} of {accountCount} accounts
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={loading || page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Previous
                </button>
                <span className="min-w-16 text-center text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={loading || page >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            {/* Modal header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-gabarito">Edit Account</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Code: {editing.code}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {eError && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{eError}</div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Account Code</label>
                <input type="text" value={eCode} onChange={(e) => setECode(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Account Name</label>
                <input type="text" value={eName} onChange={(e) => setEName(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Account Type</label>
                <select value={eType} onChange={(e) => setEType(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                </select>
              </div>

              {/* Is Active + Is Cash toggles inside modal */}
              <div className="flex items-center gap-6 pt-1">
                <EditToggle on={eActive} onChange={setEActive} label="Is Active" />
                <EditToggle on={eCash} onChange={setECash} label="Is Cash" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6537eb] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#5629da] disabled:opacity-50">
                  {saving ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"/>Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
