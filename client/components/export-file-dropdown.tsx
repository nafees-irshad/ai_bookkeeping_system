"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth/tokens";

export type ExportFileType = "csv" | "xlsx";

interface ExportFileDropdownProps {
  bookId: number | null;
  fileName: string;
  onExport: (
    bookId: number,
    fileType: ExportFileType,
    token: string,
  ) => Promise<Blob>;
}

export default function ExportFileDropdown({
  bookId,
  fileName,
  onExport,
}: ExportFileDropdownProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (fileType: ExportFileType) => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (bookId === null) {
      setError("Select a book before exporting.");
      return;
    }

    try {
      setExporting(true);
      setError(null);
      setMenuOpen(false);
      const blob = await onExport(bookId, fileType, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName}.${fileType}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={bookId === null || exporting}
        onClick={() => {
          setError(null);
          setMenuOpen((open) => !open);
        }}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {exporting ? "Exporting..." : "Export to excel"}
        <svg
          className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {menuOpen && (
        <div
          role="menu"
          aria-label="Export options"
          className="absolute right-0 z-10 mt-2 min-w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {(["csv", "xlsx"] as const).map((fileType) => (
            <button
              key={fileType}
              type="button"
              role="menuitem"
              onClick={() => void handleExport(fileType)}
              className="block w-full cursor-pointer px-4 py-2 text-left text-sm font-medium uppercase text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {fileType}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
