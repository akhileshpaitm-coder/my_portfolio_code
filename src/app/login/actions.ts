"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

/**
 * Server Action for the login form.
 * Calls NextAuth's signIn("credentials") which validates the credentials
 * against the users collection in MongoDB (bcrypt). On success the JWT session cookie
 * is set and the user is redirected to the dashboard (or their original
 * callbackUrl).
 *
 * Note: signIn's redirect is implemented by throwing a control-flow error,
 * so non-AuthError exceptions must be rethrown, never swallowed.
 */
export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rawCallbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Server-side email format check (mirrors the client validation)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Only allow same-origin relative paths (prevents open redirects)
  const callbackUrl =
    rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/dashboard";

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return {}; // Unreachable — signIn always redirects on success
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // NEXT_REDIRECT and other control-flow errors
  }
}
