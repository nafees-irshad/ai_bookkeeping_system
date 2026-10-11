"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBook, BooksData } from "@/lib/api/booksApi";
import { getAccessToken } from "@/lib/auth/tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function Calendar({ value, onChange, minDate, maxDate }: CalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(value.getFullYear() / 12) * 12);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "days") {
      setViewDate(new Date(year, month - 1, 1));
    } else if (viewMode === "months") {
      setViewDate(new Date(year - 1, month, 1));
    } else {
      setYearRangeStart((prev) => prev - 12);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === "days") {
      setViewDate(new Date(year, month + 1, 1));
    } else if (viewMode === "months") {
      setViewDate(new Date(year + 1, month, 1));
    } else {
      setYearRangeStart((prev) => prev + 12);
    }
  };

  // Day grid calculations
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  const remaining = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), inMonth: false });
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const isDayDisabled = (d: Date) => {
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  };

  const isMonthDisabled = (mIndex: number) => {
    if (minDate) {
      if (year < minDate.getFullYear()) return true;
      if (year === minDate.getFullYear() && mIndex < minDate.getMonth()) return true;
    }
    if (maxDate) {
      if (year > maxDate.getFullYear()) return true;
      if (year === maxDate.getFullYear() && mIndex > maxDate.getMonth()) return true;
    }
    return false;
  };

  const isYearDisabled = (y: number) => {
    if (minDate && y < minDate.getFullYear()) return true;
    if (maxDate && y > maxDate.getFullYear()) return true;
    return false;
  };

  const weeks: { date: Date; inMonth: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const yearsList = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-[245px] rounded-xl border border-slate-200/90 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/5 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Previous"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Clickable Month & Year in Header */}
        <div className="flex items-center gap-1">
          {viewMode === "days" && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode("months");
                }}
                className="rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 transition-colors"
                title="Choose Month"
              >
                {MONTHS[month]}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setYearRangeStart(Math.floor(year / 12) * 12);
                  setViewMode("years");
                }}
                className="rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 transition-colors"
                title="Choose Year"
              >
                {year}
              </button>
            </>
          )}

          {viewMode === "months" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setYearRangeStart(Math.floor(year / 12) * 12);
                setViewMode("years");
              }}
              className="rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 transition-colors"
              title="Choose Year"
            >
              {year}
            </button>
          )}

          {viewMode === "years" && (
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100">
              {yearRangeStart} - {yearRangeStart + 11}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Next"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── Days View ── */}
      {viewMode === "days" && (
        <>
          <div className="grid grid-cols-7 gap-0.5 mb-1 text-center">
            {DAYS.map((d) => (
              <div key={d} className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 py-0.5">
                {d}
              </div>
            ))}
          </div>

          <div className="space-y-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {week.map(({ date, inMonth }, di) => {
                  const selected = isSameDay(date, value);
                  const disabled = isDayDisabled(date);
                  return (
                    <button
                      key={di}
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) onChange(date);
                      }}
                      className={`h-6 w-full text-center text-[11px] font-medium rounded transition-colors ${
                        selected
                          ? "bg-indigo-600 font-bold text-white shadow-xs"
                          : disabled
                          ? "text-slate-300 dark:text-zinc-600 cursor-not-allowed"
                          : inMonth
                          ? "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          : "text-slate-300 hover:bg-slate-100 dark:text-zinc-600 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Months View ── */}
      {viewMode === "months" && (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {SHORT_MONTHS.map((mName, mIdx) => {
            const isCurrent = mIdx === month && year === value.getFullYear();
            const disabled = isMonthDisabled(mIdx);
            return (
              <button
                key={mName}
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    setViewDate(new Date(year, mIdx, 1));
                    setViewMode("days");
                  }
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-xs"
                    : disabled
                    ? "text-slate-300 dark:text-zinc-600 cursor-not-allowed"
                    : "text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
                }`}
              >
                {mName}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Years View ── */}
      {viewMode === "years" && (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {yearsList.map((y) => {
            const isCurrent = y === value.getFullYear();
            const disabled = isYearDisabled(y);
            return (
              <button
                key={y}
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    setViewDate(new Date(y, month, 1));
                    setViewMode("days");
                  }
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-xs"
                    : disabled
                    ? "text-slate-300 dark:text-zinc-600 cursor-not-allowed"
                    : "text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Currency list ─────────────────────────────────────────────────────────────

const CURRENCIES = [
  "PKR", "USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD",
  "INR", "JPY", "CNY", "CHF", "SGD", "MYR", "BDT",
];

// ─── Create Book Component ─────────────────────────────────────────────────────

export default function CreateBook() {
  const router = useRouter();

  const defaultStart = new Date(new Date().getFullYear(), 6, 1); // July 1 this year
  const defaultEnd = new Date(new Date().getFullYear() + 1, 5, 30); // June 30 next year

  const [bookName, setBookName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [periodStart, setPeriodStart] = useState<Date>(defaultStart);
  const [periodEnd, setPeriodEnd] = useState<Date>(defaultEnd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);

  const handleStartChange = useCallback((date: Date) => {
    setPeriodStart(date);
    if (date >= periodEnd) {
      const nextYear = new Date(date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear.setDate(nextYear.getDate() - 1);
      setPeriodEnd(nextYear);
    }
    setShowStartCal(false);
  }, [periodEnd]);

  const handleEndChange = useCallback((date: Date) => {
    setPeriodEnd(date);
    setShowEndCal(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bookName.trim()) {
      setError("Book name is required.");
      return;
    }
    if (periodEnd <= periodStart) {
      setError("Period end must be after period start.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("You are not authenticated. Please log in.");
      return;
    }

    const payload: BooksData = {
      name: bookName.trim(),
      currency,
      period_start: toISODate(periodStart),
      period_end: toISODate(periodEnd),
    };

    try {
      setLoading(true);
      await createBook(payload, token);
      router.push("/books");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create book.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/books");
  };

  const closeCalendars = useCallback(() => {
    setShowStartCal(false);
    setShowEndCal(false);
  }, []);

  return (
    <div onClick={closeCalendars} className="max-w-3xl">
      {/* Page Title & Subtitle */}
      <div className="mb-3.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 font-gabarito">
          Create Book
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 font-gabarito" data-subtext="true">
          Set up a new accounting book for your business.
        </p>
      </div>

      {/* Main Card */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} noValidate>
          {/* Error Banner */}
          {error && (
            <div className="mb-3.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Book Name */}
          <div className="mb-3.5">
            <label
              htmlFor="book-name"
              className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1"
            >
              Book Name
            </label>
            <input
              id="book-name"
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="e.g. Bob-Lazaro-Book"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400"
            />
          </div>

          {/* Currency */}
          <div className="mb-3.5">
            <label
              htmlFor="currency"
              className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1"
            >
              Currency
            </label>
            <div className="relative w-44">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-slate-900 outline-none transition-all cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-400"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Period Start */}
          <div className="mb-3.5">
            <label
              htmlFor="period-start-btn"
              className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1"
            >
              Period Start
            </label>
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <button
                id="period-start-btn"
                type="button"
                onClick={() => {
                  setShowStartCal((prev) => !prev);
                  setShowEndCal(false);
                }}
                className={`flex w-48 items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  showStartCal
                    ? "border-indigo-600 ring-2 ring-indigo-500/10 dark:border-indigo-400"
                    : "border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                } bg-white text-slate-800 dark:bg-zinc-900 dark:text-zinc-100`}
              >
                <span>{toISODate(periodStart)}</span>
                <svg
                  className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>

              {/* Popup positioned right in front (to the right) or towards upward */}
              {showStartCal && (
                <div className="absolute z-50 left-0 bottom-[calc(100%+8px)] sm:bottom-auto sm:left-[calc(100%+14px)] sm:-top-2 animate-in fade-in zoom-in-95 duration-150">
                  <Calendar value={periodStart} onChange={handleStartChange} />
                </div>
              )}
            </div>
          </div>

          {/* Period End */}
          <div className="mb-5">
            <label
              htmlFor="period-end-btn"
              className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1"
            >
              Period End
            </label>
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <button
                id="period-end-btn"
                type="button"
                onClick={() => {
                  setShowEndCal((prev) => !prev);
                  setShowStartCal(false);
                }}
                className={`flex w-48 items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  showEndCal
                    ? "border-indigo-600 ring-2 ring-indigo-500/10 dark:border-indigo-400"
                    : "border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                } bg-white text-slate-800 dark:bg-zinc-900 dark:text-zinc-100`}
              >
                <span>{toISODate(periodEnd)}</span>
                <svg
                  className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>

              {/* Popup positioned right in front and towards upward */}
              {showEndCal && (
                <div className="absolute z-50 left-0 bottom-[calc(100%+8px)] sm:left-[calc(100%+14px)] sm:-bottom-2 animate-in fade-in zoom-in-95 duration-150">
                  <Calendar
                    value={periodEnd}
                    onChange={handleEndChange}
                    minDate={new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + 1)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-98 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {loading ? "Creating…" : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

