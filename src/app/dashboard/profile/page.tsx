import { auth } from "@/lib/auth";

/**
 * Profile page — account details from the JWT session (id, name, email,
 * role mirrored from the MySQL users row at login).
 */
export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
          Account
        </span>
        <div className="section-bar" />
      </div>
      <h2 className="mb-8 text-2xl font-bold text-zinc-100 sm:text-3xl">
        Your <span className="gradient-text">Profile</span>
      </h2>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-2xl font-bold text-white">
            {(user?.name ?? "U")
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("") || "U"}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              {user?.name}
            </h3>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            <span className="tag-chip mt-2 !px-3 !py-0.5 text-[11px] capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4 border-t border-zinc-800/60 pt-6">
          {[
            { label: "Display name", value: user?.name ?? "—" },
            { label: "Email", value: user?.email ?? "—" },
            { label: "Role", value: user?.role ?? "—" },
            { label: "Session strategy", value: "JWT (stateless)" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {row.label}
              </span>
              <span className="text-zinc-300">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
