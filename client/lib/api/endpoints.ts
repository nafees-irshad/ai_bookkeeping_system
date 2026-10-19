export const ENDPOINTS = {
    AUTH: {
        SIGNUP: "/auth/register/",
        LOGIN: "/auth/token/", // token_obtain_pair — accepts username + password
        ME: "/auth/me/",
        TOKEN_REFRESH: "/auth/token/refresh/",
        LOGOUT: "/auth/logout/",
    },
    BOOKS: {
        CREATE_BOOK: "/books/",
        GET_BOOKS: "/books/",
        GET_BOOK: (id: number) => `/books/${id}`,
    },
    ACCOUNTS: {
        GET_ALL_CHART_OF_ACCOUNTS: "/accounts/",
        CREATE_CHART_OF_ACCOUNT: (bookId: number) =>
            `/books/${bookId}/accounts/`,

        GET_CHART_OF_ACCOUNTS: (bookId: number, page = 1, createdByMe = false) =>
            `/books/${bookId}/accounts/?page=${page}${createdByMe ? "&created_by=me" : ""}`,

        GET_CHART_OF_ACCOUNT: (bookId: number, accountId: number) =>
            `/books/${bookId}/accounts/${accountId}/`,

        UPDATE_CHART_OF_ACCOUNT: (bookId: number, accountId: number) =>
            `/books/${bookId}/accounts/${accountId}/`,

        ALL_LEDGERS: (bookId: number) =>
            `/books/${bookId}/accounts/ledgers/`,
        EXPORT_ALL_LEDGERS: (bookId: number, fileType: "csv" | "xlsx") =>
            `/books/${bookId}/accounts/export-ledgers/?file_type=${fileType}`,
        EXPORT_LEDGER: (
            bookId: number,
            accountId: number,
            fileType: "csv" | "xlsx",
        ) =>
            `/books/${bookId}/accounts/${accountId}/export-ledger/?file_type=${fileType}`,
        TRIAL_BALANCE: (bookId: number) =>
            `/books/${bookId}/accounts/trial-balance/`,
    },
    JOURNAL_ENTRIES: {
        CREATE: (bookId: number) => `/books/${bookId}/journal-entries/`,
        LIST: (bookId: number, page = 1) =>
            `/books/${bookId}/journal-entries/?page=${page}`,
        DETAIL: (bookId: number, entryId: number) =>
            `/books/${bookId}/journal-entries/${entryId}/`,
        BULK: (bookId: number) => `/books/${bookId}/journal-entries/bulk/`,
        AI_DRAFT: (bookId: number) =>
            `/books/${bookId}/journal-entries/ai-draft/`,
        IMPORT_TEMPLATE: (bookId: number) =>
            `/books/${bookId}/journal-entries/import-template/`,
        IMPORT: (bookId: number) =>
            `/books/${bookId}/journal-entries/import/`,
        EXPORT: (bookId: number, fileType: "csv" | "xlsx") =>
            `/books/${bookId}/journal-entries/export/?file_type=${fileType}`,
    },
};
