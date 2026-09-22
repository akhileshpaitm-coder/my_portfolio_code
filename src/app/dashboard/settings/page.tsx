import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import SiteSettingsForm from "./SiteSettingsForm";

/**
 * Settings page — session/security summary plus site settings
 * (dashboard-managed homepage strings: Hero, Contact info, Footer).
 */
export default async function SettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-3xl">🔒</p>
          <h1 className="mt-3 text-lg font-semibold text-zinc-100">
            Admin access required
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your account does not have permission to manage site settings.
          </p>
        </div>
      </div>
    );
  }

  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
          Preferences
        </span>
        <div className="section-bar" />
      </div>
      <h2 className="mb-8 text-2xl font-bold text-zinc-100 sm:text-3xl">
        <span className="gradient-text">Settings</span>
      </h2>

      {/* ── Site settings ── */}
      <div className="glass mb-10 rounded-2xl p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-zinc-100">
          Site <span className="gradient-text">Settings</span>
        </h3>
        <p className="mb-6 text-xs text-zinc-500">
          Edit the homepage strings — Hero badge, stats and tagline, contact
          info, and footer social links. Changes go live immediately.
        </p>
        <SiteSettingsForm settings={settings} />
      </div>

      {/* ── Security summary ── */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">
          Security
        </h3>
        <div className="space-y-4">
          {[
            {
              label: "Authentication",
              value: "NextAuth.js (Credentials + JWT)",
              desc: "Password verified against the users collection (MongoDB)",
            },
            {
              label: "Session",
              value: "HttpOnly signed cookie · 7 days",
              desc: "Signed with AUTH_SECRET, HttpOnly + SameSite=Lax",
            },
            {
              label: "Signed in as",
              value: session?.user?.email ?? "—",
              desc: "Role: " + (session?.user?.role ?? "—"),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {row.label}
                </div>
                <div className="mt-0.5 text-xs text-zinc-600">{row.desc}</div>
              </div>
              <span className="text-sm text-zinc-300">{row.value}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          More account preferences are coming soon.
        </p>
      </div>
    </div>
  );
}
