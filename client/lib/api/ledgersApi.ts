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
