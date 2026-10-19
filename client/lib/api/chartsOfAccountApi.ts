import { api } from "./index";
import { ENDPOINTS } from "./endpoints";

export interface CreateChartOfAccountData {
    code: string;
    name: string;
    type: string;
    is_active?: boolean;
    is_cash?: boolean;
}

export interface UpdateChartOfAccountData {
    code?: string;
    name?: string;
    type?: string;
    is_active?: boolean;
    is_cash?: boolean;
}

export interface ChartOfAccount {
    id: number;
    book_id: number;
    code: string;
    name: string;
    type: string;
    normal_side: string;
    is_active: boolean;
    is_cash: boolean;
    is_suspense: boolean;
    created_by_id: number | null;
    created_by_name: string | null;
    created_at: string;
}

export interface PaginatedAccountsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ChartOfAccount[];
}

export async function createChartOfAccount(
    bookId: number,
    data: CreateChartOfAccountData,
    token: string,
): Promise<ChartOfAccount> {
    return api<ChartOfAccount>(
        ENDPOINTS.ACCOUNTS.CREATE_CHART_OF_ACCOUNT(bookId),
        {
            method: "POST",
            token,
            body: JSON.stringify(data),
        },
    );
}

export async function getAllChartOfAccounts(
    token: string,
    page = 1,
    createdByMe = false,
): Promise<PaginatedAccountsResponse | ChartOfAccount[]> {
    const query = new URLSearchParams({ page: String(page) });
    if (createdByMe) {
        query.set("created_by", "me");
    }

    return api<PaginatedAccountsResponse | ChartOfAccount[]>(
        `${ENDPOINTS.ACCOUNTS.GET_ALL_CHART_OF_ACCOUNTS}?${query.toString()}`,
        {
            method: "GET",
            token,
        },
    );
}

export async function getBookChartOfAccounts(
    bookId: number,
    token: string,
): Promise<ChartOfAccount[]> {
    const accounts: ChartOfAccount[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await api<PaginatedAccountsResponse | ChartOfAccount[]>(
            ENDPOINTS.ACCOUNTS.GET_CHART_OF_ACCOUNTS(bookId, page),
            { method: "GET", token },
        );

        if (Array.isArray(response)) {
            accounts.push(...response);
            hasMore = false;
        } else {
            accounts.push(...response.results);
            hasMore = response.next !== null;
            page += 1;
        }
    }

    return accounts;
}

export async function getChartOfAccount(
    bookId: number,
    accountId: number,
    token: string,
): Promise<ChartOfAccount> {
    return api<ChartOfAccount>(
        ENDPOINTS.ACCOUNTS.GET_CHART_OF_ACCOUNT(bookId, accountId),
        {
            method: "GET",
            token,
        },
    );
}

export async function updateChartOfAccount(
    bookId: number,
    accountId: number,
    data: UpdateChartOfAccountData,
    token: string,
): Promise<ChartOfAccount> {
    return api<ChartOfAccount>(
        ENDPOINTS.ACCOUNTS.UPDATE_CHART_OF_ACCOUNT(bookId, accountId),
        {
            method: "PATCH",
            token,
            body: JSON.stringify(data),
        },
    );
}
