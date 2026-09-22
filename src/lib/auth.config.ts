import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Shareable NextAuth config (no `auth()` export — safe to import from
 * proxy.ts / middleware). The full instance in lib/auth.ts wraps this with
 * the jwt/session callbacks.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        try {
          // Lazy import: keeps @/lib/db (TypeORM/MongoDB) out of the
          // middleware/proxy bundle so the DataSource singleton — and its
          // entity-class identity — lives only in the server bundle.
          const { getUserByEmail } = await import("@/lib/db");
          const user = await getUserByEmail(email);
          if (!user) return null;

          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return null;

          // Only the fields consumed by the jwt/session callbacks
          return { id: String(user.id), name: user.name, email: user.email, role: user.role };
        } catch (error) {
          console.error("[auth] authorize failed:", error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
