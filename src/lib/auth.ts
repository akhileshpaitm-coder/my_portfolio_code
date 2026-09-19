import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * NextAuth v5 (Auth.js) instance.
 * Credentials auth + JWT sessions are configured in auth.config.ts; this file
 * adds the jwt/session callbacks that copy the MySQL user id/role into the
 * token and session objects.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "admin" | "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig);
