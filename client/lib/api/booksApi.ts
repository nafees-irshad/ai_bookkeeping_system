import { api } from "./index";
import { ENDPOINTS } from "./endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BooksData {
    name: string;
    currency: string;
    period_start: string; // ISO date string e.g. "2026-07-01"
    period_end: string; // ISO date string e.g. "2027-06-30"
}

export interface Book {
    id: number;
    name: string;
    currency: string;
    period_start: string;
    period_end: string;
    is_closed?: boolean;
    owner?: string | number;
    is_owner?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Create a new accounting book.
 * Requires a valid Bearer access token.
 */
export async function createBook(
    data: BooksData,
    token: string,
): Promise<Book> {
    return api<Book>(ENDPOINTS.BOOKS.CREATE_BOOK, {
        method: "POST",
        body: JSON.stringify(data),
        token,
    });
}

/**
 * Retrieve all books belonging to the authenticated user.
 * Supports both DRF paginated { count, results: [...] } and flat array [...] responses.
 * Requires a valid Bearer access token.
 */
export async function getBooks(token: string): Promise<Book[]> {
    const res = await api<PaginatedResponse<Book> | Book[]>(
        ENDPOINTS.BOOKS.GET_BOOKS,
        {
            method: "GET",
            token,
        },
    );

    if (Array.isArray(res)) {
        return res;
    }
    if (res && Array.isArray((res as PaginatedResponse<Book>).results)) {
        return (res as PaginatedResponse<Book>).results;
    }
    return [];
}

/**
 * Retrieve a single book by its ID.
 * Requires a valid Bearer access token.
 */
export async function getBookById(id: number, token: string): Promise<Book> {
    return api<Book>(ENDPOINTS.BOOKS.GET_BOOK(id), {
        method: "GET",
        token,
    });
}

/**
 * Update an existing book by its ID.
 * Requires a valid Bearer access token.
 */
export async function updateBook(
    id: number,
    data: Partial<BooksData>,
    token: string,
): Promise<Book> {
    const endpoint = typeof ENDPOINTS.BOOKS.GET_BOOK === "function"
        ? ENDPOINTS.BOOKS.GET_BOOK(id)
        : `${ENDPOINTS.BOOKS.GET_BOOK}${id}/`;
    return api<Book>(endpoint, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
    });
}

/**
 * Delete a book by its ID.
 * Requires a valid Bearer access token.
 */
export async function deleteBook(id: number, token: string): Promise<void> {
    const endpoint = typeof ENDPOINTS.BOOKS.GET_BOOK === "function"
        ? ENDPOINTS.BOOKS.GET_BOOK(id)
        : `${ENDPOINTS.BOOKS.GET_BOOK}${id}/`;
    return api<void>(endpoint, {
        method: "DELETE",
        token,
    });
}
