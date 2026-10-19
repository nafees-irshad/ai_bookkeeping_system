import Link from "next/link";
import type { JournalEntry } from "@/lib/api/journalEntriesApi";

export default function JournalEntryPosted({
  entry,
  currency,
}: {
  entry: JournalEntry;
  currency: string;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-900/60 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Entry posted successfully</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-zinc-100">
        Journal Entry #{entry.entry_no}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
        {entry.description}
      </p>
      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left dark:bg-zinc-900">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-slate-500 dark:text-zinc-400">Date</span>
          <span className="font-medium text-slate-800 dark:text-zinc-200">{entry.date}</span>
        </div>
        <div className="mt-2 flex justify-between gap-4 text-sm">
          <span className="text-slate-500 dark:text-zinc-400">Total</span>
          <span className="font-semibold text-slate-900 dark:text-zinc-100">
            {Number(entry.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
          </span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={`/journal/entries/${entry.id}`}
          className="rounded-lg bg-[#6537eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5629da]"
        >
          View journal entry
        </Link>
        <Link
          href="/journal/entries"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          All entries
        </Link>
      </div>
    </section>
  );
}
