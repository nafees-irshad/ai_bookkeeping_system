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
    },
};
