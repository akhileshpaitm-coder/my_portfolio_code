import Link from "next/link";
import { auth } from "@/lib/auth";
import { getContactMessagesPage } from "@/lib/contact";
import DeleteMessageButton from "./DeleteMessageButton";
import StatusFilterTabs, {
  type StatusFilter,
  type TabCounts,
} from "./StatusFilterTabs";

export const metadata = {
  title: "Contact Messages | Dashboard",
};

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  new: {
    label: "New",
    cls: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
  },
  read: {
    label: "Read",
    cls: "bg-zinc-800/60 text-zinc-400 border border-zinc-700",
  },
  replied: {
    label: "Replied",
    cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.read;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const EMPTY_TEXT: Record<StatusFilter, string> = {
  all: "No messages yet — submissions from the contact form will appear here.",
  new: "No unread messages — you're all caught up.",
  read: "No read messages yet.",
  replied: "No replies sent yet.",
};

/** Compact page-number window: 1 … 4 5 6 … N. */
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

/**
 * Admin: history of contact form submissions with reply status.
 * Status filtering via ?status=new|read|replied, pagination via ?page=N.
 * Unread messages are highlighted and always sort to the top.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-3xl">🔒</p>
          <h1 className="mt-3 text-lg font-semibold text-zinc-100">
            Admin access required
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your account does not have permission to manage messages.
          </p>
        </div>
      </div>
    );
  }

  const { status, page: pageParam } = await searchParams;
  const filter: StatusFilter =
    status === "new" || status === "read" || status === "replied"
      ? status
      : "all";
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);

  const {
    messages,
    total,
    allTotal,
    counts,
    page,
    totalPages,
    pageSize,
  } = await getContactMessagesPage({
    status: filter === "all" ? undefined : filter,
    page: Number.isNaN(requestedPage) ? 1 : requestedPage,
    pageSize: PAGE_SIZE,
  });
  const unread = counts.new;

  const tabCounts: TabCounts = {
    counts: {
      all: allTotal,
      new: counts.new,
      read: counts.read,
      replied: counts.replied,
    },
    allTotal,
  };

  /** Pagination link preserving the filter and page. */
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/dashboard/messages?${qs}` : "/dashboard/messages";
  };

  const pageBtn =
    "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition-colors";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
            Contact <span className="gradient-text">Messages</span>
          </h2>
          {allTotal > 0 && (
            <p className="mt-1 text-sm text-zinc-500">
              {filter === "all"
                ? `${allTotal} message${allTotal === 1 ? "" : "s"}${unread > 0 ? ` · ${unread} unread` : ""}`
                : `${total} ${filter} of ${allTotal} total`}
            </p>
          )}
        </div>
      </div>

      {/* Status filter — counts poll live via StatusFilterTabs */}
      <StatusFilterTabs
        initialCounts={tabCounts}
        activeFilter={filter}
      />

      {total === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
          {EMPTY_TEXT[filter]}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {messages.map((m) => {
              const isNew = m.status === "new";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center ${
                    isNew
                      ? "border-cyan-500/40 bg-cyan-500/[0.06] ring-1 ring-cyan-500/20"
                      : "border-zinc-800/60 bg-zinc-900/40"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isNew && (
                        <span
                          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-400"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`truncate text-sm font-semibold ${
                          isNew ? "text-zinc-50" : "text-zinc-300"
                        }`}
                      >
                        {m.name}
                      </span>
                      <StatusBadge status={m.status} />
                      <span className="shrink-0 text-[11px] text-zinc-600">
                        {new Date(m.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div
                      className={`mt-1 truncate text-sm ${
                        isNew ? "font-medium text-zinc-100" : "text-zinc-200"
                      }`}
                    >
                      {m.subject}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">
                      {m.message}
                    </div>
                    <div className="mt-1 truncate text-xs text-zinc-600">
                      {m.email}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/dashboard/messages/${m.id}`}
                      className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
                        isNew
                          ? "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                          : "border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
                      }`}
                    >
                      {m.status === "replied" ? "View reply" : "Open"}
                    </Link>
                    <DeleteMessageButton id={m.id} subject={m.subject} compact />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="mt-8 flex flex-col items-center gap-3"
              aria-label="Messages pagination"
            >
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className={`${pageBtn} border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300`}
                  >
                    ← Prev
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={`${pageBtn} border-zinc-800/60 text-zinc-700`}
                  >
                    ← Prev
                  </span>
                )}

                {pageNumbers(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-1 text-xs text-zinc-600">
                      …
                    </span>
                  ) : p === page ? (
                    <span
                      key={p}
                      aria-current="page"
                      className={`${pageBtn} border-cyan-500/40 bg-cyan-500/10 text-cyan-300`}
                    >
                      {p}
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      className={`${pageBtn} border-zinc-800 text-zinc-500 hover:border-cyan-500/40 hover:text-cyan-300`}
                    >
                      {p}
                    </Link>
                  )
                )}

                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className={`${pageBtn} border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300`}
                  >
                    Next →
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={`${pageBtn} border-zinc-800/60 text-zinc-700`}
                  >
                    Next →
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, total)} of {total}
              </p>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
