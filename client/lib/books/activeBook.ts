"use client";

import { getBooks } from "@/lib/api/booksApi";

const ACTIVE_BOOK_ID_KEY = "active_book_id";
const ACTIVE_BOOK_NAME_KEY = "active_book_name";

export function getActiveBookId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_BOOK_ID_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function setActiveBookId(id: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_BOOK_ID_KEY, String(id));
}

export function getActiveBookName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_BOOK_NAME_KEY);
}

export function setActiveBookName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_BOOK_NAME_KEY, name);
}

export async function resolveActiveBook(token: string) {
  const books = await getBooks(token);
  const savedId = getActiveBookId();
  const book = books.find((item) => item.id === savedId) ?? books[0] ?? null;

  if (book) {
    setActiveBookId(book.id);
    setActiveBookName(book.name);
  }

  return book;
}
