import { auth } from "@/lib/auth";
import { getVisitStats, type VisitStats } from "@/lib/visits";
import VisitorStatsPanel from "./VisitorStatsPanel";

const stats = [
  { value: "6+", label: "Years Experience", icon: "🚀", gradient: "#06b6d4" },
  { value: "50+", label: "Projects Delivered", icon: "🤝", gradient: "#8b5cf6" },
  { value: "20+", label: "Technologies", icon: "🛠️", gradient: "#ec4899" },
];

/**
 * Dashboard overview — welcome banner and stats, using the site's
 * glass-card / gradient styling.
 */
export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "there").split(" ")[0];

  // Visitor traffic — zeros if the collections are missing (migration
  // pending); the panel still renders so the dashboard never breaks.
  let visitStats: VisitStats = {
    total: 0,
    today: 0,
    todayUnique: 0,
    yesterday: 0,
    yesterdayUnique: 0,
    last7: [],
    last30: [],
    topPages: [],
  };
  try {
    visitStats = await getVisitStats();
  } catch {
    // keep defaults
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Heading */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
          Overview
        </span>
        <div className="section-bar" />
      </div>

      {/* Welcome banner */}
      <div className="glass relative mb-8 overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="absolute top-1/3 right-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />
        <h1 className="relative mb-2 text-2xl font-bold text-zinc-100 sm:text-3xl">
          Welcome back, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="relative text-sm text-zinc-400">
          You are signed in with a secure JWT session. Manage your account from
          the sidebar or the profile menu.
        </p>
      </div>

      {/* Visitor traffic (live) */}
      <VisitorStatsPanel initialStats={visitStats} />

      {/* Stats */}
      <div className="mb-10 grid gap-5 sm:grid-cols-3 stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="skill-card rounded-2xl p-6">
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
              style={{
                background: `linear-gradient(135deg, ${stat.gradient}22, ${stat.gradient}11)`,
                border: `1px solid ${stat.gradient}30`,
              }}
            >
              {stat.icon}
            </div>
            <div className="text-3xl font-bold gradient-text">{stat.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
