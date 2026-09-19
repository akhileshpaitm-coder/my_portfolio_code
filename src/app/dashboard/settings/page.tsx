import { auth } from "@/lib/auth";

/**
 * Settings page — session/security summary. Placeholder for future
 * account preferences.
 */
export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
          Preferences
        </span>
        <div className="section-bar" />
      </div>
      <h2 className="mb-8 text-2xl font-bold text-zinc-100 sm:text-3xl">
        <span className="gradient-text">Settings</span>
      </h2>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">
          Security
        </h3>
        <div className="space-y-4">
          {[
            {
              label: "Authentication",
              value: "NextAuth.js (Credentials + JWT)",
              desc: "Password verified against the MySQL users table",
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
