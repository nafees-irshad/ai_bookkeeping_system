"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  downloadJournalEntriesTemplate,
  importJournalEntries,
  type ImportJournalEntriesResponse,
} from "@/lib/api/journalEntriesApi";
import { getAccessToken } from "@/lib/auth/tokens";
import { resolveActiveBook } from "@/lib/books/activeBook";
import type { Book } from "@/lib/api/booksApi";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function ImportJournalEntries() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportJournalEntriesResponse | null>(null);

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
          setError("Create or select a book before importing journal entries.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load the active book.");
      } finally {
        setLoadingBook(false);
      }
    };
    void loadBook();
  }, [router]);

  const handleTemplateDownload = async () => {
    const token = getAccessToken();
    if (!book || !token) {
      if (!token) router.push("/login");
      else setError("Select a book before downloading the template.");
      return;
    }
    try {
      setDownloading(true);
      setError(null);
      const blob = await downloadJournalEntriesTemplate(book.id, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "journal_template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to download the Excel template.");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (selectedFile: File | undefined) => {
    setError(null);
    setResult(null);
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setError("Choose an .xlsx Excel file.");
      return;
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setError("The file must be no larger than 5 MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!book) {
      setError("Select a book before importing journal entries.");
      return;
    }
    if (!file) {
      setError("Choose an .xlsx file to upload.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const response = await importJournalEntries(book.id, file, token);
      setResult(response);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import journal entries.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/journal/entries"
          className="mb-3 inline-flex text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
        >
          ← Journal entries
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Import Journal Entries
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400" data-subtext="true">
          Import balanced journal entries from an Excel workbook
          {book ? ` into ${book.name}` : ""}.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-900/60 dark:bg-violet-950/20">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-zinc-100">Start with the Excel template</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Use the template columns and voucher format expected by the importer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleTemplateDownload()}
          disabled={loadingBook || !book || downloading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#6537eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5629da] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? "Downloading..." : "Download import-template"}
        </button>
      </section>

      <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Upload Excel file</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Upload an .xlsx file (maximum 5 MB). Rows are grouped by voucher number.
          </p>
        </div>

        <label
          htmlFor="journal-import-file"
          className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center transition hover:border-violet-400 hover:bg-violet-50/50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
        >
          <svg className="mb-3 h-9 w-9 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5M12 3v12" />
          </svg>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            {file ? file.name : "Choose an Excel file to upload"}
          </span>
          <span className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "Click to browse for an .xlsx file"}
          </span>
          <input
            ref={fileInput}
            id="journal-import-file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </label>

        {result && (
          <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
              Imported {result.imported} journal {result.imported === 1 ? "entry" : "entries"} successfully.
            </p>
            <Link href="/journal/entries" className="mt-1 inline-block text-sm font-semibold text-emerald-800 underline dark:text-emerald-300">
              View journal entries
            </Link>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {loadingBook ? "Loading book..." : book ? `Book currency: ${book.currency}` : "No active book"}
          </p>
          <button
            type="submit"
            disabled={!file || !book || loadingBook || uploading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#6537eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5629da] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Importing..." : "Upload and import"}
          </button>
        </div>
      </form>
    </div>
  );
}
