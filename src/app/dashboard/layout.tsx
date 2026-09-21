import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { countUnreadMessages } from "@/lib/contact";
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

  return (
    <DashboardShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
