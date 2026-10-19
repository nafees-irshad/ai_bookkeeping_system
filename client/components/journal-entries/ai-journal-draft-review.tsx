"use client";

import type {
  CreateJournalEntryData,
  JournalEntryDraftReview,
} from "@/lib/api/journalEntriesApi";

interface AiJournalDraftReviewProps {
  drafts: CreateJournalEntryData[];
  review: JournalEntryDraftReview[];
  currency: string;
  posting: boolean;
  onDecline: (index: number) => void;
  onPost: () => void;
  onBack: () => void;
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AiJournalDraftReview({
  drafts,
  review,
  currency,
  posting,
  onDecline,
  onPost,
  onBack,
}: AiJournalDraftReviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
            Review generated entries
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Decline any entries you do not want to post. Nothing is posted until you select Post.
          </p>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
          {drafts.length} {drafts.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-zinc-700">
          <p className="font-semibold text-slate-800 dark:text-zinc-200">
            All generated entries were declined
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Go back to change your description and generate a new set.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {drafts.map((draft, index) => {
            const entryReview = review[index];
            const total = draft.lines.reduce(
              (sum, line) => sum + Number(line.debit || 0),
              0,
            );

            return (
              <li
                key={`${draft.reference}-${index}`}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      {draft.date} {draft.reference ? `· ${draft.reference}` : ""}
                    </p>
                    <h3 className="mt-1 font-bold text-slate-900 dark:text-zinc-100">
                      {draft.description}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                      Total: {formatAmount(String(total))} {currency}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={posting}
                    onClick={() => onDecline(index)}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    Decline
                  </button>
                </div>

                {entryReview && (
                  <div className={`border-b px-4 py-2 text-xs ${
                    entryReview.needs_review
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-slate-100 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  }`}>
                    {entryReview.needs_review ? "Review recommended" : "AI confidence"}:{" "}
                    {Math.round(entryReview.confidence * 100)}% — {entryReview.reason}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-3">Account</th>
                        <th className="px-4 py-3">Narration</th>
                        <th className="px-4 py-3 text-right">Debit</th>
                        <th className="px-4 py-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {draft.lines.map((line, lineIndex) => (
                        <tr key={`${line.account}-${lineIndex}`}>
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">
                            Account #{line.account}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-zinc-300">
                            {line.narration || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                            {formatAmount(line.debit)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                            {formatAmount(line.credit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 dark:border-zinc-800">
        <button
          type="button"
          disabled={posting}
          onClick={onBack}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
        >
          Back to description
        </button>
        <button
          type="button"
          disabled={posting || drafts.length === 0}
          onClick={onPost}
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-[#6537eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5629da] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {posting ? "Posting..." : `Post ${drafts.length} ${drafts.length === 1 ? "entry" : "entries"}`}
        </button>
      </div>
    </section>
  );
}
