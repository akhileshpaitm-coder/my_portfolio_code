import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { countUnreadMessages } from "@/lib/contact";
import { readActionToast } from "@/lib/action-toast";
import ActionToastListener from "@/app/components/ActionToastListener";
import DashboardShell from "./DashboardShell";

export const metadata = {
  title: "Dashboard | Akhilesh Prajapati",
};

/**
 * Protected dashboard layout.
 * The proxy (src/proxy.ts) filters unauthenticated requests first; this
 * server-side session check is the authoritative gate (defense in depth).
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Unread contact messages (admin only) — drives the sidebar badge.
  // Wrapped so a missing table (migration pending) can't break the dashboard.
  let unreadCount = 0;
  if (session.user.role === "admin") {
    try {
      unreadCount = await countUnreadMessages();
    } catch {
      unreadCount = 0;
    }
  }

  // One-shot flash toast left by a redirecting server action (create/update/delete).
  const actionToast = await readActionToast();

  return (
    <DashboardShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
      unreadCount={unreadCount}
    >
      <ActionToastListener actionToast={actionToast} />
      {children}
    </DashboardShell>
  );
}
