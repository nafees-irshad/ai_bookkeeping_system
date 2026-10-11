"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBooks, deleteBook, Book } from "@/lib/api/booksApi";
import { getAccessToken } from "@/lib/auth/tokens";

// ─── Books Listing Page ────────────────────────────────────────────────────────

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBooks = async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getBooks(token);
      const list = Array.isArray(data) ? data : ((data as any)?.results ?? []);
      setBooks(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      setDeletingId(id);
      await deleteBook(id, token);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete book.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px",
        }}
      >
        <div>
          <h1 className="font-gabarito text-slate-800 dark:text-zinc-100" style={{ fontSize: "28px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            My Books
          </h1>
          <p className="font-gabarito" data-subtext="true" style={{ color: "#64748b", marginTop: "6px", fontSize: "14px" }}>
            Manage your accounting books below.
          </p>
        </div>
        <Link
          href="/books/new"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "11px 22px", fontSize: "14px", fontWeight: 600,
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff", borderRadius: "10px", textDecoration: "none",
            boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
            transition: "opacity 0.2s",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: "16px", height: "16px" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Book
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
            padding: "12px 16px", marginBottom: "24px", color: "#dc2626", fontSize: "14px",
          }}
        >
          {error}
          <button
            onClick={fetchBooks}
            style={{ marginLeft: "12px", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "14px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div
            style={{
              width: "40px", height: "40px", border: "3px solid #e2e8f0",
              borderTopColor: "#7c3aed", borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && books.length === 0 && (
        <div
          style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px",
            padding: "60px 32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📒</div>
          <h2 className="font-gabarito" style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
            No books yet
          </h2>
          <p className="font-gabarito" data-subtext="true" style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
            Create your first accounting book to get started.
          </p>
          <Link
            href="/books/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 24px", fontSize: "14px", fontWeight: 600,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff", borderRadius: "10px", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
            }}
          >
            Create Book
          </Link>
        </div>
      )}

      {/* Books grid */}
      {!loading && !error && books.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              className="cursor-default rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:shadow-black/30"
            >
              {/* Book icon + currency and status badges */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #7c3aed22, #6d28d911)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: "22px", height: "22px" }}
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" /><path d="M6 10h10" />
                  </svg>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {book.is_closed !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        book.is_closed
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      }`}
                    >
                      {book.is_closed ? "Closed" : "Active"}
                    </span>
                  )}
                  <span
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                  >
                    {book.currency}
                  </span>
                </div>
              </div>

              <h3 className="font-gabarito text-slate-800 dark:text-zinc-100" style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
                {book.name}
              </h3>

              <p className="font-gabarito text-slate-500 dark:text-zinc-400" data-subtext="true" style={{ fontSize: "12px", marginBottom: "18px" }}>
                📅 {book.period_start} → {book.period_end}
              </p>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href={`/books/${book.id}`}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-[13px] font-semibold text-slate-700 transition-colors hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500/60"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(book.id)}
                  disabled={deletingId === book.id}
                  className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                >
                  {deletingId === book.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
