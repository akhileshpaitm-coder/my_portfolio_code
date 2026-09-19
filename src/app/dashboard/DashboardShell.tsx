"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface ShellUser {
  name: string;
  email: string;
  role: "admin" | "user";
}

/**
 * Dashboard shell — Sidebar + Header + content area.
 * Client component so the mobile drawer toggle and the profile dropdown
 * can share UI state.
 */
export default function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col md:pl-64">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-zinc-800/60 px-4 py-4 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} — Akhilesh Prajapati
        </footer>
      </div>
    </div>
  );
}
