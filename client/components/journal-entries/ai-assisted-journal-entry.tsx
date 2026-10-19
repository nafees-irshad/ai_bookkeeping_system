"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBulkJournalEntries,
  generateJournalEntryDrafts,
  type CreateJournalEntryData,
  type JournalEntry,
  type JournalEntryAiDraftResponse,
} from "@/lib/api/journalEntriesApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";
import AiJournalDraftReview from "./ai-journal-draft-review";

export default function AiAssistedJournalEntry() {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [rawText, setRawText] = useState("");
  const [loadingBook, setLoadingBook] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftResult, setDraftResult] =
    useState<JournalEntryAiDraftResponse | null>(null);
  const [drafts, setDrafts] = useState<CreateJournalEntryData[]>([]);
  const [postedEntries, setPostedEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    const loadBook = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const activeBook = await resolveActiveBook(token);
        setBook(activeBook);
        if (!activeBook) {
          setError("Create or select a book before creating journal entries.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load the active book.");
      } finally {
        setLoadingBook(false);
      }
    };
    void loadBook();
  }, [router]);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!book) {
      setError("Select a book before creating journal entries.");
      return;
    }
    if (!rawText.trim()) {
      setError("Enter a description of the transactions to create entries.");
      return;
    }

    setGenerating(true);
    setError(null);
    setDrafts([]);
    setDraftResult(null);
    setPostedEntries([]);
    try {
      const generated = await generateJournalEntryDrafts(book.id, rawText.trim(), token);
      if (!Array.isArray(generated.drafts) || generated.drafts.length === 0) {
        throw new Error("The AI did not generate any journal entries. Add more detail and try again.");
      }
      setDraftResult(generated);
      setDrafts(generated.drafts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate journal entries.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDecline = (draftIndex: number) => {
    setDrafts((currentDrafts) =>
      currentDrafts.filter((_, index) => index !== draftIndex),
    );
    setDraftResult((currentResult) => currentResult
      ? {
          ...currentResult,
          review: currentResult.review
            .filter((item) => item.index !== draftIndex)
            .map((item, index) => ({ ...item, index })),
        }
      : null);
  };

  const handlePost = async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!book) {
      setError("Select a book before posting journal entries.");
      return;
    }
    if (drafts.length === 0) {
      setError("There are no entries to post. Generate entries or keep at least one draft.");
      return;
    }

    setPosting(true);
    setError(null);
    try {
      const entries = await createBulkJournalEntries(book.id, drafts, token);
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error("The server returned no posted entries.");
      }
      setPostedEntries(entries);
      setDrafts([]);
      setDraftResult(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post journal entries.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/journal/entries"
          className="mb-3 inline-flex text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
        >
          ← Journal entries
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          AI-assisted entry
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Describe transactions in plain language{book ? ` for ${book.name}` : ""}.
          Review generated entries before posting.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {postedEntries.length > 0 ? (
        <section
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/30"
        >
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
            {postedEntries.length} {postedEntries.length === 1 ? "entry" : "entries"} posted
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-emerald-900 dark:text-emerald-200">
            {postedEntries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/journal/entries/${entry.id}`}
                  className="font-semibold underline decoration-emerald-500/50 underline-offset-2"
                >
                  Entry #{entry.entry_no}: {entry.description}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setPostedEntries([]);
              setRawText("");
            }}
            className="mt-5 rounded-lg bg-[#6537eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5629da]"
          >
            Create more entries
          </button>
        </section>
      ) : draftResult ? (
        <AiJournalDraftReview
          drafts={drafts}
          review={draftResult.review}
          currency={book?.currency ?? ""}
          posting={posting}
          onDecline={handleDecline}
          onPost={() => void handlePost()}
          onBack={() => {
            setDrafts([]);
            setDraftResult(null);
            setError(null);
          }}
        />
      ) : (
        <form
          onSubmit={(event) => void handleGenerate(event)}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <label
            htmlFor="ai-journal-description"
            className="block text-lg font-bold text-slate-900 dark:text-zinc-100"
          >
            Describe your transactions
          </label>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Include dates, amounts, payment methods, and what each transaction was for.
          </p>
          <textarea
            id="ai-journal-description"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            maxLength={5000}
            rows={8}
            placeholder="For example: On 2026-10-17 purchased office equipment for PKR 25,000 in cash..."
            disabled={generating}
            className="mt-4 block w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-violet-950"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Generated entries will not be posted until you confirm.
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {rawText.length}/5000
            </span>
          </div>
          <button
            type="submit"
            disabled={loadingBook || !book || generating || !rawText.trim()}
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6537eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5629da] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {generating ? "Generating entries..." : "Generate entries"}
          </button>
        </form>
      )}
    </div>
  );
}
