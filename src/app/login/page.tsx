import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Login | Akhilesh Prajapati",
  description: "Sign in to access the dashboard.",
};

/**
 * Login page — mirrors the site theme (dark background, glass card,
 * cyan→purple gradient accents, floating blobs).
 * Already-authenticated users are bounced to /dashboard.
 */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background blobs (same as hero section) */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Grid pattern overlay (same as hero section) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e4e4e7 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <Image
              src="/assets/site_images/logo-icon.png"
              alt=""
              width={52}
              height={33}
              priority
              className="h-12 w-auto"
            />
            <span className="gradient-text text-2xl font-bold tracking-tight">
              Akhilesh Prajapati
            </span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8 sm:p-10">
          <div className="mb-2 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-2xl">
              🔒
            </div>
          </div>

          <h1 className="mb-1 text-center text-2xl font-bold text-zinc-100">
            Welcome <span className="gradient-text">back</span>
          </h1>
          <p className="mb-8 text-center text-sm text-zinc-500">
            Sign in to access your dashboard
          </p>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link
            href="/"
            className="transition-colors hover:text-zinc-400"
          >
            ← Back to portfolio
          </Link>
        </p>
      </div>
    </main>
  );
}
