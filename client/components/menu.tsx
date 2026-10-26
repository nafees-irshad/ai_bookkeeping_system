"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

interface SubMenuItem {
  title: string;
  href: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface MenuItem {
  title: string;
  subtitle?: string;
  href?: string;
  icon: React.ReactNode;
  showChevron?: boolean;
  subItems?: SubMenuItem[];
}

interface MenuSection {
  category?: string;
  items: MenuItem[];
}

export default function Menu() {
  const pathname = usePathname();
  const { logout, isAuthenticating } = useAuth();

  // State to track which collapsible menus are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "My books": false,
    "Invoices": false,
    "Costs": false,
    "Chart of accounts": false,
    "Journal entries": false,
    "Ledger": false,
    "Reports": false,
    "Sharing": false,
    "Settings": false,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  useEffect(() => {
    if (pathname.startsWith("/books")) {
      setOpenSections((prev) => ({ ...prev, "My books": true }));
    } else if (pathname.startsWith("/invoices")) {
      setOpenSections((prev) => ({ ...prev, Invoices: true }));
    } else if (pathname.startsWith("/costs")) {
      setOpenSections((prev) => ({ ...prev, Costs: true }));
    } else if (pathname.startsWith("/journal")) {
      setOpenSections((prev) => ({ ...prev, "Journal entries": true }));
    } else if (pathname.startsWith("/accounts")) {
      setOpenSections((prev) => ({ ...prev, "Chart of accounts": true }));
    } else if (pathname.startsWith("/ledger")) {
      setOpenSections((prev) => ({ ...prev, Ledger: true }));
    } else if (pathname.startsWith("/reports")) {
      setOpenSections((prev) => ({ ...prev, Reports: true }));
    } else if (pathname.startsWith("/sharing")) {
      setOpenSections((prev) => ({ ...prev, Sharing: true }));
    } else if (pathname.startsWith("/settings")) {
      setOpenSections((prev) => ({ ...prev, Settings: true }));
    }
  }, [pathname]);

  const menuSections: MenuSection[] = [
    // Top Section - Dashboard only (no "CORE" title, no Books)
    {
      items: [
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
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
      ],
    },
    // Business Operations Section
    {
      category: "BUSINESS OPERATIONS",
      items: [
        {
          title: "Invoices",
          subtitle: "Sales, purchases, credit notes",
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
              <path d="M6 2h12a2 2 0 0 1 2 2v18l-4-2-4 2-4-2-4 2V4a2 2 0 0 1 2-2z" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="9" y1="12" x2="15" y2="12" />
            </svg>
          ),
          subItems: [
            {
              title: "Sales Invoice",
              href: "/invoices/sales",
              icon: (
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="m9 15 3-3 3 3" />
                </svg>
              ),
            },
            {
              title: "Purchase Invoice",
              href: "/invoices/purchase",
              icon: (
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 12v6" />
                  <path d="m15 15-3 3-3-3" />
                </svg>
              ),
            },
            {
              title: "Sales Credit Note",
              href: "/invoices/sales-credit-note",
              icon: (
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              ),
            },
            {
              title: "Purchase Credit Note",
              href: "/invoices/purchase-credit-note",
              icon: (
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
              ),
            },
          ],
        },
        {
          title: "Costs",
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
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
            </svg>
          ),
          subItems: [
            {
              title: "Direct Costs",
              href: "/costs/direct",
              icon: (
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
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
              ),
            },
            {
              title: "Operating Expenses",
              href: "/costs/operating",
              icon: (
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
                  <path d="M3 21h18" />
                  <path d="M5 21V7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14" />
                  <path d="M14 21V11a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v10" />
                </svg>
              ),
            },
            {
              title: "Financial Costs",
              href: "/costs/financial",
              icon: (
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
                  <line x1="2" y1="22" x2="22" y2="22" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                  <line x1="6" y1="18" x2="6" y2="10" />
                  <line x1="12" y1="18" x2="12" y2="10" />
                  <line x1="18" y1="18" x2="18" y2="10" />
                  <path d="m2 10 10-7 10 7" />
                </svg>
              ),
            },
            {
              title: "Taxes & Statutory Charges",
              href: "/costs/taxes",
              icon: (
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
                  <rect width="16" height="20" x="4" y="2" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="16" y1="14" x2="16" y2="14.01" />
                  <line x1="16" y1="18" x2="16" y2="18.01" />
                  <line x1="12" y1="14" x2="12" y2="14.01" />
                  <line x1="12" y1="18" x2="12" y2="18.01" />
                  <line x1="8" y1="14" x2="8" y2="14.01" />
                  <line x1="8" y1="18" x2="8" y2="18.01" />
                </svg>
              ),
            },
            {
              title: "Other Accounting Expenses",
              href: "/costs/others",
              icon: (
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
                  <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
                  <path d="m2 12 8.58 3.91a2 2 0 0 0 1.66 0L20.82 12" />
                  <path d="m2 17 8.58 3.91a2 2 0 0 0 1.66 0L20.82 17" />
                </svg>
              ),
            },
          ],
        },
      ],
    },
    // Accounting Section
    {
      category: "ACCOUNTING",
      items: [
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
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          ),
          subItems: [
            {
              title: "All books",
              href: "/books",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
              ),
            },
            {
              title: "New book",
              href: "/books/new",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <line x1="12" y1="8" x2="12" y2="14" />
                  <line x1="9" y1="11" x2="15" y2="11" />
                </svg>
              ),
            },
            {
              title: "Shared with me",
              href: "/books/shared",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              ),
            },
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
              <rect width="7" height="7" x="3" y="3" rx="1.5" />
              <rect width="7" height="7" x="14" y="3" rx="1.5" />
              <rect width="7" height="7" x="14" y="14" rx="1.5" />
              <rect width="7" height="7" x="3" y="14" rx="1.5" />
            </svg>
          ),
          subItems: [
            {
              title: "All accounts",
              href: "/accounts",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect width="7" height="7" x="3" y="3" rx="1.5" />
                  <rect width="7" height="7" x="14" y="3" rx="1.5" />
                  <rect width="7" height="7" x="14" y="14" rx="1.5" />
                  <rect width="7" height="7" x="3" y="14" rx="1.5" />
                </svg>
              ),
            },
            {
              title: "Add account",
              href: "/accounts/new",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              ),
            },
            {
              title: "Bulk add",
              href: "/accounts/bulk",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              ),
            },
            {
              title: "Import from Excel",
              href: "/accounts/import",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h8" />
                  <path d="M8 17h8" />
                  <path d="M12 9v8" />
                </svg>
              ),
            },
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
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="12" y2="16" />
            </svg>
          ),
          subItems: [
            {
              title: "All entries",
              href: "/journal/entries",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              ),
            },
            {
              title: "New entry",
              href: "/journal/new",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              ),
            },
            {
              title: "Bulk entry",
              href: "/journal/bulk",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </svg>
              ),
            },
            {
              title: "Import from Excel",
              href: "/journal/import",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h8" />
                  <path d="M8 17h8" />
                  <path d="M12 9v8" />
                </svg>
              ),
            },
            {
              title: "AI-assisted entry",
              href: "/journal/ai",
              badge: "AI",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              ),
            },
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
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          ),
          subItems: [
            {
              title: "Account ledger",
              href: "/ledger/account",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
              ),
            },
            {
              title: "All ledgers",
              href: "/ledger/all",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M8 2v20" />
                  <line x1="12" y1="7" x2="16" y2="7" />
                  <line x1="12" y1="12" x2="16" y2="12" />
                </svg>
              ),
            },
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
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 17v-2" />
              <path d="M12 17v-4" />
              <path d="M16 17v-6" />
            </svg>
          ),
          subItems: [
            {
              title: "Trial balance",
              href: "/reports/trial-balance",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="M7 21h10" />
                  <path d="M12 3v18" />
                  <path d="M3 7h18" />
                </svg>
              ),
            },
            {
              title: "Cash flow",
              href: "/reports/cash-flow",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                  <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                </svg>
              ),
            },
            {
              title: "Profit and loss",
              href: "/reports/profit-loss",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              ),
            },
          ],
        },
      ],
    },
    // Analysis Section
    {
      category: "ANALYSIS",
      items: [
        {
          title: "Cost analysis",
          href: "/analysis/costs",
          showChevron: true,
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
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
              <line x1="6" y1="20" x2="6" y2="18" />
              <line x1="10" y1="20" x2="10" y2="15" />
              <line x1="14" y1="20" x2="14" y2="12" />
              <line x1="18" y1="20" x2="18" y2="9" />
            </svg>
          ),
        },
        {
          title: "Cash flow",
          href: "/reports/cash-flow",
          showChevron: true,
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
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
          ),
        },
        {
          title: "AI insights",
          href: "/journal/ai",
          showChevron: true,
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
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
              <path d="M9.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path d="M14.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            </svg>
          ),
        },
      ],
    },
    // Business / System Section
    {
      category: "BUSINESS",
      items: [
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
      ],
    },
  ];

  return (
    <aside
      data-menu="true"
      className="w-64 shrink-0 flex flex-col justify-between bg-slate-50/60 h-[calc(100vh-52px)] sticky top-[52px] select-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-3 px-3 font-outfit transition-colors dark:bg-zinc-950"
    >
      {/* Navigation Sections */}
      <div className="flex flex-col space-y-4">
        {menuSections.map((section, secIdx) => (
          <div key={section.category || `sec-${secIdx}`} className="flex flex-col">
            {/* Section Heading (only rendered if category exists) */}
            {section.category && (
              <span className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {section.category}
              </span>
            )}

            {/* Section Items */}
            <div className="flex flex-col space-y-0.5">
              {section.items.map((item) => {
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                const isOpen = openSections[item.title];

                // Check active state
                const isSingleActive =
                  !hasSubItems &&
                  (pathname === item.href || (item.title === "Dashboard" && (pathname === "/" || pathname === "/dashboard")));

                const isParentActive =
                  hasSubItems &&
                  (item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href)) ?? false);

                const isActive = isSingleActive || isParentActive;

                return (
                  <div key={item.title} className="flex flex-col">
                    {hasSubItems ? (
                      /* Collapsible Parent Item */
                      <button
                        type="button"
                        onClick={() => toggleSection(item.title)}
                        className={`group relative flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-violet-600/15 via-violet-600/5 to-transparent text-slate-900 font-semibold dark:text-white"
                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
                        }`}
                      >
                        {/* Purple vertical bar indicator for active parent */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.85)]"
                            aria-hidden="true"
                          />
                        )}

                        <div className="flex items-center gap-3">
                          <span
                            className={`shrink-0 transition-colors ${
                              isActive
                                ? "text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                                : "text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <div className="flex flex-col text-left">
                            <span className="leading-snug">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-[11px] font-normal leading-tight text-slate-400 dark:text-zinc-500">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rotating Chevron */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                            isOpen
                              ? "rotate-90 text-slate-600 dark:text-zinc-300"
                              : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                          }`}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ) : (
                      /* Single Direct Link (e.g. Dashboard, Analysis items) */
                      <Link
                        href={item.href || "#"}
                        className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-violet-600/15 via-violet-600/5 to-transparent text-slate-900 font-semibold dark:text-white"
                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
                        }`}
                      >
                        {/* Purple vertical bar indicator for active item */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.85)]"
                            aria-hidden="true"
                          />
                        )}

                        <div className="flex items-center gap-3">
                          <span
                            className={`shrink-0 transition-colors ${
                              isActive
                                ? "text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                                : "text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.title}</span>
                        </div>

                        {item.showChevron && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                      </Link>
                    )}

                    {/* Submenu Items - Clean indented list with optional icons, no vertical guide line */}
                    {hasSubItems && isOpen && item.subItems && (
                      <div className="mt-1 flex flex-col space-y-0.5 pl-6 pr-1 py-0.5">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.href;

                          return (
                            <Link
                              key={sub.title}
                              href={sub.href}
                              className={`group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${
                                isSubActive
                                  ? "bg-violet-500/15 text-violet-700 font-semibold dark:bg-violet-500/20 dark:text-violet-300"
                                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                {sub.icon && (
                                  <span
                                    className={`shrink-0 transition-colors ${
                                      isSubActive
                                        ? "text-violet-600 dark:text-violet-400"
                                        : "text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                                    }`}
                                  >
                                    {sub.icon}
                                  </span>
                                )}
                                <span>{sub.title}</span>
                              </span>
                              {sub.badge && (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isSubActive
                                      ? "bg-violet-600 text-white dark:bg-violet-500 dark:text-white"
                                      : "bg-slate-200/80 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                                  }`}
                                >
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
          </div>
        ))}
      </div>

      {/* Logout Action at Bottom - Clean and subtle, no profile icon, no border line */}
      <div className="pt-3 mt-4">
        <button
          type="button"
          onClick={() => void logout()}
          disabled={isAuthenticating}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-wait disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          <span className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600 dark:text-zinc-500 dark:group-hover:text-rose-400">
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
          </span>
          <span>{isAuthenticating ? "Logging out..." : "Log out"}</span>
        </button>
      </div>
    </aside>
  );
}
