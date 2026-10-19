import { api } from "./index";
import { ENDPOINTS } from "./endpoints";

export interface LedgerRow {
    date: string;
    entry_no: number;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

export interface AccountLedger {
    code: string;
    name: string;
    type: string;
    opening_balance: number;
    total_debit: number;
    total_credit: number;
    closing_balance: number;
    rows: LedgerRow[];
}

export async function getAllLedgers(
    bookId: number,
    token: string,
): Promise<AccountLedger[]> {
    return api<AccountLedger[]>(ENDPOINTS.ACCOUNTS.ALL_LEDGERS(bookId), {
        method: "GET",
        token,
    });
}

export async function exportAllLedgers(
    bookId: number,
    fileType: "csv" | "xlsx",
    token: string,
): Promise<Blob> {
    return api<Blob>(ENDPOINTS.ACCOUNTS.EXPORT_ALL_LEDGERS(bookId, fileType), {
        method: "GET",
        token,
        responseType: "blob",
    });
}

export async function exportLedger(
    bookId: number,
    accountId: number,
    fileType: "csv" | "xlsx",
    token: string,
): Promise<Blob> {
    return api<Blob>(
        ENDPOINTS.ACCOUNTS.EXPORT_LEDGER(bookId, accountId, fileType),
        {
            method: "GET",
            token,
            responseType: "blob",
        },
    );
}
