import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  return (
    <DashboardShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
