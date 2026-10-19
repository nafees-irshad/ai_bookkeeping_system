import { api } from "./index";
import { ENDPOINTS } from "./endpoints";
import type { PaginatedResponse } from "./booksApi";

export interface JournalEntryLineInput {
    account: number;
    debit: string;
    credit: string;
    narration: string;
}

export interface CreateJournalEntryData {
    date: string;
    reference: string;
    description: string;
    lines: JournalEntryLineInput[];
}

export interface JournalEntryLine extends JournalEntryLineInput {
    id: number;
    account_name: string;
}

export interface JournalEntry {
    id: number;
    entry_no: number;
    date: string;
    reference: string;
    description: string;
    lines: JournalEntryLine[];
    total: string;
    created_by: number;
    created_at: string;
}

export type JournalEntriesResponse =
    | PaginatedResponse<JournalEntry>
    | JournalEntry[];

export interface ImportJournalEntriesResponse {
    imported: number;
    entries: JournalEntry[];
}

export interface JournalEntryDraftReview {
    index: number;
    confidence: number;
    needs_review: boolean;
    reason: string;
}

export interface JournalEntryAiDraftResponse {
    drafts: CreateJournalEntryData[];
    count: number;
    model_used: {
        provider: string;
        model: string;
    };
    posted: false;
    review: JournalEntryDraftReview[];
}

export async function createJournalEntry(
    bookId: number,
    data: CreateJournalEntryData,
    token: string,
): Promise<JournalEntry> {
    return api<JournalEntry>(ENDPOINTS.JOURNAL_ENTRIES.CREATE(bookId), {
        method: "POST",
        token,
        body: JSON.stringify(data),
    });
}

export async function generateJournalEntryDrafts(
    bookId: number,
    rawText: string,
    token: string,
): Promise<JournalEntryAiDraftResponse> {
    return api<JournalEntryAiDraftResponse>(
        ENDPOINTS.JOURNAL_ENTRIES.AI_DRAFT(bookId),
        {
            method: "POST",
            token,
            body: JSON.stringify({ raw_text: rawText }),
        },
    );
}

export async function createBulkJournalEntries(
    bookId: number,
    entries: CreateJournalEntryData[],
    token: string,
): Promise<JournalEntry[]> {
    return api<JournalEntry[]>(ENDPOINTS.JOURNAL_ENTRIES.BULK(bookId), {
        method: "POST",
        token,
        body: JSON.stringify(entries),
    });
}

export async function getJournalEntries(
    bookId: number,
    token: string,
    page = 1,
): Promise<JournalEntriesResponse> {
    return api<JournalEntriesResponse>(
        ENDPOINTS.JOURNAL_ENTRIES.LIST(bookId, page),
        { method: "GET", token },
    );
}

export async function getJournalEntry(
    bookId: number,
    entryId: number,
    token: string,
): Promise<JournalEntry> {
    return api<JournalEntry>(
        ENDPOINTS.JOURNAL_ENTRIES.DETAIL(bookId, entryId),
        { method: "GET", token },
    );
}

export async function downloadJournalEntriesTemplate(
    bookId: number,
    token: string,
): Promise<Blob> {
    return api<Blob>(ENDPOINTS.JOURNAL_ENTRIES.IMPORT_TEMPLATE(bookId), {
        method: "GET",
        token,
        responseType: "blob",
    });
}

export async function importJournalEntries(
    bookId: number,
    file: File,
    token: string,
): Promise<ImportJournalEntriesResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return api<ImportJournalEntriesResponse>(
        ENDPOINTS.JOURNAL_ENTRIES.IMPORT(bookId),
        {
            method: "POST",
            token,
            body: formData,
        },
    );
}