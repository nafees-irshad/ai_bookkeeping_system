import React from "react";
import Navbar from "@/components/layout/navbar";
import Menu from "@/components/menu";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Menu />
        <main data-main-scroll="true" className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
