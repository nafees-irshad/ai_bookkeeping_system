"use client";

import ExportFileDropdown from "@/components/export-file-dropdown";
import { exportJournalEntries } from "@/lib/api/journalEntriesApi";
import type { Book } from "@/lib/api/booksApi";

interface ExportJournalEntriesProps {
  book: Book | null;
}

export default function ExportJournalEntries({ book }: ExportJournalEntriesProps) {
  return (
    <ExportFileDropdown
      bookId={book?.id ?? null}
      fileName="journal_entries"
      onExport={exportJournalEntries}
    />
  );
}
