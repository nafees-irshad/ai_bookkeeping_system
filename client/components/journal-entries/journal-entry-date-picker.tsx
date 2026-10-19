"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function JournalEntryDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(value);
  const [viewDate, setViewDate] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const isSelected = (date: Date) =>
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  return (
    <div ref={pickerRef} className="relative">
      <label
        htmlFor="journal-entry-date"
        className="block text-sm font-semibold text-slate-800 dark:text-zinc-200"
      >
        Date
      </label>
      <button
        id="journal-entry-date"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }
          setOpen((current) => !current);
        }}
        className={`mt-2 flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-sm font-normal text-slate-800 transition dark:bg-zinc-900 dark:text-zinc-100 ${
          open
            ? "border-violet-600 ring-2 ring-violet-500/15 dark:border-violet-400"
            : "border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600"
        }`}
      >
        <span>{value}</span>
        <svg
          className="h-4 w-4 text-slate-400 dark:text-zinc-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose journal entry date"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(280px,calc(100vw-3rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/5 sm:left-[calc(100%+12px)] sm:top-[-2.75rem]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-100">
              <span>{MONTHS[month]}</span>
              <span>{year}</span>
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-1 text-xs font-semibold text-slate-400 dark:text-zinc-500">
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, index) =>
              day === null ? (
                <span key={`blank-${index}`} aria-hidden="true" />
              ) : (
                <button
                  key={day}
                  type="button"
                  aria-label={new Date(year, month, day).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  aria-pressed={isSelected(new Date(year, month, day))}
                  onClick={() => {
                    const selected = new Date(year, month, day);
                    onChange(formatDate(selected));
                    setOpen(false);
                  }}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    isSelected(new Date(year, month, day))
                      ? "bg-violet-600 font-bold text-white shadow-sm"
                      : "text-slate-700 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-200 dark:hover:bg-violet-950/60 dark:hover:text-violet-300"
                  }`}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
