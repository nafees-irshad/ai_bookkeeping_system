"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      data-navbar="true"
      className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 font-outfit backdrop-blur transition-colors supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-sm shadow-indigo-200 dark:shadow-none">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-transparent" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accu<span className="text-indigo-600 dark:text-indigo-400">Books</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/5 dark:bg-[#211f29] dark:text-zinc-400 dark:hover:bg-[#2b2935] dark:hover:text-zinc-200"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-[#211f29]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#211f29] dark:shadow-black/40">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-white/10">
                  <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Notifications</span>
                  <span className="cursor-pointer text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Mark all read
                  </span>
                </div>
                <div className="py-3 text-center text-sm text-slate-500 dark:text-zinc-400">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pl-1 pr-3.5 transition hover:bg-slate-100/80 dark:border-white/5 dark:bg-[#211f29] dark:hover:bg-[#2b2935]">
            <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-white/10">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Alex"
                width={28}
                height={28}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Alex</span>
          </div>
        </div>
      </div>
    </header>
  );
}
