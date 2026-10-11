"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SubMenuItem {
  title: string;
  href: string;
  badge?: string;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  isLogout?: boolean;
}

export default function Menu() {
  const pathname = usePathname();

  // State to track which collapsible menus are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "My books": true,
    "Journal entries": false,
    "Chart of accounts": false,
    "Ledger": false,
    "Reports": false,
    "Sharing": false,
    "Settings": false,
  });

  const [activeItem, setActiveItem] = useState<string>("All books");

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  React.useEffect(() => {
    if (pathname.startsWith("/accounts")) {
      setOpenSections((prev) => ({ ...prev, "Chart of accounts": true }));
    } else if (pathname.startsWith("/books")) {
      setOpenSections((prev) => ({ ...prev, "My books": true }));
    } else if (pathname.startsWith("/journal")) {
      setOpenSections((prev) => ({ ...prev, "Journal entries": true }));
    } else if (pathname.startsWith("/ledger")) {
      setOpenSections((prev) => ({ ...prev, "Ledger": true }));
    } else if (pathname.startsWith("/reports")) {
      setOpenSections((prev) => ({ ...prev, "Reports": true }));
    }
  }, [pathname]);

  const menuData: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: (
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
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
    },
    {
      title: "My books",
      icon: (
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
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      ),
      subItems: [
        { title: "All books", href: "/books" },
        { title: "New book", href: "/books/new" },
        { title: "Shared with me", href: "/books/shared" },
      ],
    },
    {
      title: "Chart of accounts",
      icon: (
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
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      subItems: [
        { title: "All accounts", href: "/accounts" },
        { title: "Add account", href: "/accounts/new" },
        { title: "Bulk add", href: "/accounts/bulk" },
        { title: "Import from Excel", href: "/accounts/import" },
      ],
    },
    {
      title: "Journal entries",
      icon: (
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      subItems: [
        { title: "All entries", href: "/journal/entries" },
        { title: "New entry", href: "/journal/new" },
        { title: "Bulk entry", href: "/journal/bulk" },
        { title: "Import from Excel", href: "/journal/import" },
        { title: "AI-assisted entry", href: "/journal/ai", badge: "AI" },
      ],
    },
    {
      title: "Ledger",
      icon: (
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
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      subItems: [
        { title: "Account ledger", href: "/ledger/account" },
        { title: "All ledgers", href: "/ledger/all" },
      ],
    },
    {
      title: "Reports",
      icon: (
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
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      ),
      subItems: [
        { title: "Trial balance", href: "/reports/trial-balance" },
        { title: "Cash flow", href: "/reports/cash-flow" },
        { title: "Profit and loss", href: "/reports/profit-loss" },
      ],
    },
    {
      title: "Sharing",
      icon: (
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      subItems: [
        { title: "Manage access", href: "/sharing/access" },
        { title: "Share book", href: "/sharing/share" },
      ],
    },
    {
      title: "Settings",
      icon: (
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      subItems: [
        { title: "My profile", href: "/settings/profile" },
        { title: "Change password", href: "/settings/password" },
        { title: "Manage users (admin)", href: "/settings/users" },
      ],
    },
  ];

  return (
    <aside
      data-menu="true"
      className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-200/80 bg-[#f8f9fa] h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto py-4 px-3 font-outfit transition-colors dark:border-zinc-800 dark:bg-zinc-950"
    >
      {/* Navigation List */}
      <div className="flex flex-col space-y-1">
        {menuData.map((item) => {
          const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
          const isOpen = openSections[item.title];
          const isSingleActive = item.href && (activeItem === item.title || pathname === item.href);

          return (
            <div key={item.title} className="flex flex-col">
              {hasSubItems ? (
                /* Collapsible Header */
                <button
                  type="button"
                  onClick={() => toggleSection(item.title)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isOpen
                      ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
                      : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${
                        isOpen
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-500 group-hover:text-slate-700 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="font-semibold">{item.title}</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${
                      isOpen ? "rotate-90 text-slate-600 dark:text-zinc-300" : ""
                    }`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ) : (
                /* Single Menu Item (e.g. Dashboard) */
                <Link
                  href={item.href || "#"}
                  onClick={() => setActiveItem(item.title)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    isSingleActive
                      ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200/60 dark:bg-zinc-900 dark:text-indigo-400 dark:ring-zinc-800"
                      : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`${
                      isSingleActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 group-hover:text-slate-700 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              )}

              {/* Submenu Items */}
              {hasSubItems && isOpen && item.subItems && (
                <div className="mt-1 flex flex-col space-y-0.5 pl-6 pr-1 py-1">
                  {item.subItems.map((sub) => {
                    const isSubActive = pathname === sub.href;

                    return (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        onClick={() => setActiveItem(sub.title)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isSubActive
                            ? "bg-[#6537eb] font-semibold text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {sub.title === "Add account" && (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          )}
                          {sub.title}
                        </span>
                        {sub.badge && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isSubActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                          }`}>
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logout Action at Bottom */}
      <div className="pt-4 mt-4 border-t border-slate-200/70 dark:border-zinc-800">
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
        >
          <span className="text-slate-500 group-hover:text-rose-600 dark:text-zinc-400 dark:group-hover:text-rose-400">
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
