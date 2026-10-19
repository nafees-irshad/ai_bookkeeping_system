"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth/auth-context";

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout, isAuthenticating } = useAuth();

  return (
    <header
      data-navbar="true"
      className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur font-outfit transition-colors supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo & Brand Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            {/* Brand Logo Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-sm shadow-indigo-200 dark:shadow-none">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-transparent" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Accu<span className="text-indigo-600 dark:text-indigo-400">Books</span>
            </span>
          </Link>
        </div>

        {/* Right: Actions (ThemeToggle, Notification, Profile, Logout) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
              {/* Notification Badge Dot */}
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-zinc-950" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <span className="font-semibold text-sm text-slate-900 dark:text-zinc-100">Notifications</span>
                  <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline dark:text-indigo-400">
                    Mark all read
                  </span>
                </div>
                <div className="py-3 text-sm text-slate-500 text-center dark:text-zinc-400">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pr-3.5 pl-1 shadow-xs transition hover:bg-slate-100/80 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-zinc-700">
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

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => void logout()}
            disabled={isAuthenticating}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/80 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            title="Log out"
            aria-label="Log out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">{isAuthenticating ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
