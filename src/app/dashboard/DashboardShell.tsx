"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeMessageCounts } from "@/lib/message-live";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NewMessageToast, { type NewMessageInfo } from "./NewMessageToast";

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
  unreadCount = 0,
  children,
}: {
  user: ShellUser;
  /** Initial server-rendered count — seeded into live polling. */
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
   * Live unread badge — subscribes to the shared /api/messages/counts
   * poller (src/lib/message-live.ts) so the sidebar count updates without a
   * page navigation, with a single network request per tick shared with the
   * inbox tabs. Polling pauses in hidden tabs and refreshes immediately on
   * focus (tab switch or returning to the window). When the count goes up,
   * a toast is shown and a desktop notification sent (if the user granted
   * permission).
   */
  const isUnreadAdmin = user.role === "admin";
  const [liveUnread, setLiveUnread] = useState(unreadCount);
  const [toastMessage, setToastMessage] = useState<NewMessageInfo | null>(null);
  const unreadRef = useRef(unreadCount);
  const toastRef = useRef<number | null>(null); // id already shown as a toast

  // Server revalidations (mark read/reply/delete) hand us a fresh prop —
  // adopt it over the polled value (React's adjust-state-during-render
  // pattern). unreadRef keeps the last POLLED value and is only written in
  // the poll subscription, so "went up" detection stays anchored to real
  // arrivals.
  const [prevPropUnread, setPrevPropUnread] = useState(unreadCount);
  if (unreadCount !== prevPropUnread) {
    setPrevPropUnread(unreadCount);
    setLiveUnread(unreadCount);
  }

  useEffect(() => {
    if (!isUnreadAdmin) return;

    const notify = (latest: NewMessageInfo) => {
      setToastMessage(latest);
      // Desktop notification — best effort; permission is user-granted.
      try {
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification("New contact message", {
            body: `${latest.name}: ${latest.subject}`,
          });
        }
      } catch {
        // Some browsers require a service worker; the toast still shows.
      }
    };

    return subscribeMessageCounts((data) => {
      const { unread, latest } = data;
      const prev = unreadRef.current;
      unreadRef.current = unread;
      setLiveUnread(unread);
      // Count went up → someone submitted the contact form. `latest` is
      // the newest unread row; only toast if we don't already show it.
      if (unread > prev && latest && toastRef.current !== latest.id) {
        toastRef.current = latest.id;
        notify(latest);
      }
    });
  }, [isUnreadAdmin]);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={liveUnread}
      />

      <div className="flex min-h-screen flex-col md:pl-64">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

        <NewMessageToast message={toastMessage} onDismiss={dismissToast} />

        <footer className="border-t border-zinc-800/60 px-4 py-4 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} — Akhilesh Prajapati
        </footer>
      </div>
    </div>
  );
}
