"use client";

import ExportFileDropdown from "@/components/export-file-dropdown";
import { exportLedger } from "@/lib/api/ledgersApi";

interface ExportLedgerDropdownProps {
  bookId: number | null;
  accountId: number | null;
}

export default function ExportLedgerDropdown({
  bookId,
  accountId,
}: ExportLedgerDropdownProps) {
  return (
    <div
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <ExportFileDropdown
        bookId={accountId === null ? null : bookId}
        fileName={`ledger_${accountId ?? "account"}`}
        onExport={(selectedBookId, fileType, token) => {
          if (accountId === null) {
            throw new Error("Account ID is required to export this ledger.");
          }
          return exportLedger(selectedBookId, accountId, fileType, token);
        }}
      />
    </div>
  );
}
