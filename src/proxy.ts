import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIX = "/dashboard";
const AUTH_PAGES = ["/login"];

/**
 * Route protection middleware (Next.js 16 "proxy" convention — the renamed
 * middleware.ts). Runs an optimistic JWT check from the session cookie on
 * every matched request:
 *
 * - /dashboard/*  → unauthenticated users are redirected to /login
 *                   (returning them to the page they requested after login)
 * - /login        → authenticated users are redirected to /dashboard
 *
 * The dashboard layout re-checks the session server-side, so the proxy is a
 * fast pre-filter, not the only line of defense.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Unauthenticated user trying to reach a protected page → /login?callbackUrl=…
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Already-authenticated user on a login page → /dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Run on all app pages except:
     * - api routes (NextAuth handles its own endpoints)
     * - Next.js internals and static assets
     * - common metadata files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
