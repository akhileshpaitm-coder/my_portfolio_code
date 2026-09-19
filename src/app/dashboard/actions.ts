"use server";

import { signOut } from "@/lib/auth";

/**
 * Secure logout — destroys the NextAuth JWT session (clears the HttpOnly
 * session cookie) and redirects to the login page.
 */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}
