import { api } from "./index";
import { ENDPOINTS } from "./endpoints";

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number | string;
  credit: number | string;
}

export interface TrialBalance {
  rows: TrialBalanceRow[];
  total_debit: number | string;
  total_credit: number | string;
  balanced: boolean;
}

export async function getTrialBalance(
  bookId: number,
  token: string,
): Promise<TrialBalance> {
  return api<TrialBalance>(ENDPOINTS.ACCOUNTS.TRIAL_BALANCE(bookId), {
    method: "GET",
    token,
  });
}
