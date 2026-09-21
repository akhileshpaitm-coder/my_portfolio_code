import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getContactMessageById,
  getMessageReplies,
  toggleMessageRead,
  type ContactReply,
} from "@/lib/contact";
import { toggleReadAction } from "../actions";
import ReplyForm from "./ReplyForm";
import DeleteMessageButton from "../DeleteMessageButton";

export const metadata = {
  title: "Message Detail | Dashboard",
};

/**
 * Admin: full contact message with reply form and history.
 * Opening a "new" message automatically marks it read.
 */
export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/messages");
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const message = await getContactMessageById(numericId);
  if (!message) notFound();

  // Full reply thread (oldest first). Tolerates a pending migration so the
  // page still renders even if contact_replies doesn't exist yet.
  let replies: ContactReply[] = [];
  try {
    replies = await getMessageReplies(numericId);
  } catch {
    replies = [];
  }
  const hasReplies = replies.length > 0;

  // New messages become read when opened (replied messages are untouched).
  if (message.status === "new") {
    await toggleMessageRead(numericId, true);
    message.status = "read";
  }

  const isReplied = message.status === "replied";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Message <span className="gradient-text">Detail</span>
        </h2>
        <Link
          href="/dashboard/messages"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to inbox
        </Link>
      </div>

      {/* Original message */}
      <div className="glass mb-6 rounded-2xl p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              isReplied
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-zinc-700 bg-zinc-800/60 text-zinc-400"
            }`}
          >
            {isReplied ? "Replied" : "Read"}
          </span>
          <span className="text-xs text-zinc-600">
            {new Date(message.created_at).toLocaleString("en-IN", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-zinc-100">
          {message.subject}
        </h3>
        <div className="mt-1 text-sm text-zinc-400">
          {message.name}{" "}
          <a
            href={`mailto:${message.email}`}
            className="text-cyan-400 hover:underline"
          >
            ({message.email})
          </a>
        </div>

        <div className="mt-5 whitespace-pre-wrap rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 text-sm leading-relaxed text-zinc-300">
          {message.message}
        </div>

        <div className="mt-5 flex items-center gap-2">
          {/* Mark unread/read toggle */}
          <form action={toggleReadAction}>
            <input type="hidden" name="id" value={message.id} />
            <input
              type="hidden"
              name="read"
              value={message.status === "read" ? "false" : "true"}
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
            >
              {message.status === "read" ? "Mark as unread" : "Mark as read"}
            </button>
          </form>
          <DeleteMessageButton id={message.id} subject={message.subject} />
        </div>
      </div>

      {/* Reply thread */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-zinc-100">
          {hasReplies ? (
            <>
              Reply <span className="gradient-text">History</span>
            </>
          ) : (
            <>
              Reply to <span className="gradient-text">{message.name}</span>
            </>
          )}
        </h3>
        <p className="mb-5 text-xs text-zinc-600">
          {hasReplies
            ? `${replies.length} repl${replies.length === 1 ? "y" : "ies"} emailed to ${message.email}, newest last.`
            : `Your reply will be emailed to ${message.email} and saved in this history.`}
        </p>

        {hasReplies && (
          <div className="mb-6 space-y-3">
            {replies.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
                    {r.subject}
                  </p>
                  <span className="text-[11px] text-zinc-600">
                    {new Date(r.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {r.body}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasReplies ? (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300">
              Send another reply
            </summary>
            <div className="mt-4">
              <ReplyForm id={message.id} defaultSubject={`Re: ${message.subject}`} />
            </div>
          </details>
        ) : (
          <ReplyForm id={message.id} defaultSubject={`Re: ${message.subject}`} />
        )}
      </div>
    </div>
  );
}
