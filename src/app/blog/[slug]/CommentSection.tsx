"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/toast";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import type { CommentNode } from "@/lib/blog-types";

export interface Viewer {
  id: number;
  name: string;
  role: "admin" | "user";
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ── Inline textarea used by add/reply/edit forms ── */
function CommentTextarea({
  initial,
  placeholder,
  submitLabel,
  autoFocus,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  busy: boolean;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(initial ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && text.trim().length >= 2) onSubmit(text.trim());
      }}
      className="mt-2"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        autoFocus={autoFocus}
        className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || text.trim().length < 2}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* ── One comment (recursive) ── */
function CommentItem({
  node,
  depth,
  viewer,
  replyingTo,
  editingId,
  busy,
  onReply,
  onStartEdit,
  onEditSubmit,
  onDelete,
  onReplySubmit,
}: {
  node: CommentNode;
  depth: number;
  viewer: Viewer | null;
  replyingTo: number | null;
  editingId: number | null;
  busy: boolean;
  onReply: (parentId: number) => void;
  onStartEdit: (id: number | null) => void;
  onEditSubmit: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onReplySubmit: (parentId: number, text: string) => void;
}) {
  const isOwner = viewer?.id === node.user_id;
  const isAdmin = viewer?.role === "admin";
  const wasEdited = node.updated_at.getTime() - node.created_at.getTime() > 60_000;

  return (
    <li className={depth > 0 ? "mt-4" : "py-4"}>
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-xs font-bold text-cyan-300">
          {initials(node.user_name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="font-semibold text-zinc-200">{node.user_name}</span>
            {node.user_name === "Akhilesh Prajapati" && (
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
                Author
              </span>
            )}
            <time dateTime={node.created_at.toISOString()} className="text-zinc-600">
              {timeAgo(node.created_at)}
            </time>
            {wasEdited && <span className="text-zinc-600">(edited)</span>}
          </div>

          {editingId === node.id ? (
            <CommentTextarea
              initial={node.content}
              placeholder="Update your comment…"
              submitLabel="Save"
              autoFocus
              busy={busy}
              onSubmit={(text) => onEditSubmit(node.id, text)}
              onCancel={() => onStartEdit(null)}
            />
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
              {node.content}
            </p>
          )}

          {editingId !== node.id && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              {viewer && depth < 4 && (
                <button
                  type="button"
                  onClick={() => onReply(node.id)}
                  className="cursor-pointer font-medium text-zinc-500 transition-colors hover:text-cyan-300"
                >
                  Reply
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onStartEdit(node.id)}
                  className="cursor-pointer font-medium text-zinc-500 transition-colors hover:text-cyan-300"
                >
                  Edit
                </button>
              )}
              {(isOwner || isAdmin) && (
                <button
                  type="button"
                  onClick={() => onDelete(node.id)}
                  className="cursor-pointer font-medium text-zinc-500 transition-colors hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {replyingTo === node.id && (
            <div className="mt-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
              <CommentTextarea
                placeholder={`Reply to ${node.user_name}…`}
                submitLabel="Reply"
                autoFocus
                busy={busy}
                onSubmit={(text) => onReplySubmit(node.id, text)}
                onCancel={() => onReply(0)}
              />
            </div>
          )}

          {node.replies.length > 0 && (
            <ul className="mt-2 border-l-2 border-zinc-800/80 pl-4">
              {node.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  node={r}
                  depth={depth + 1}
                  viewer={viewer}
                  replyingTo={replyingTo}
                  editingId={editingId}
                  busy={busy}
                  onReply={onReply}
                  onStartEdit={onStartEdit}
                  onEditSubmit={onEditSubmit}
                  onDelete={onDelete}
                  onReplySubmit={onReplySubmit}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

/* ── Section shell ── */
export default function CommentSection({
  postId,
  initialTree,
  initialCount,
  viewer,
}: {
  postId: number;
  initialTree: CommentNode[];
  initialCount: number;
  viewer: Viewer | null;
}) {
  const toast = useToast();
  const [tree, setTree] = useState(initialTree);
  const [count, setCount] = useState(initialCount);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; isReply: boolean } | null>(null);

  /** Insert a node under parent (or at the root) without refetching. */
  const insertNode = (parent: CommentNode[], newNode: CommentNode, parentId: number | null): boolean => {
    if (parentId === null) {
      parent.push(newNode);
      return true;
    }
    for (const node of parent) {
      if (node.id === parentId) {
        node.replies.push(newNode);
        return true;
      }
      if (insertNode(node.replies, newNode, parentId)) return true;
    }
    return false;
  };

  const handleAdd = async (content: string, parentId: number | null) => {
    if (!viewer) return;
    setBusy(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Failed to post comment.");

      const now = new Date();
      insertNode(
        [...tree],
        {
          id: data.id,
          post_id: postId,
          user_id: viewer.id,
          user_name: viewer.name,
          parent_id: parentId,
          content,
          created_at: now,
          updated_at: now,
          replies: [],
        },
        parentId
      );
      setTree([...tree]);
      setCount((c) => c + 1);
      setReplyingTo(null);
      toast.success({ title: parentId ? "Reply posted" : "Comment posted" });
    } catch (err) {
      toast.error({
        title: "Could not post your comment",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (id: number, content: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update comment.");

      const applyEdit = (nodes: CommentNode[]): boolean => {
        for (const n of nodes) {
          if (n.id === id) {
            n.content = content;
            n.updated_at = new Date();
            return true;
          }
          if (applyEdit(n.replies)) return true;
        }
        return false;
      };
      const next = [...tree];
      applyEdit(next);
      setTree(next);
      setEditingId(null);
      toast.success({ title: "Comment updated" });
    } catch (err) {
      toast.error({
        title: "Could not update your comment",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setBusy(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string; removed?: number };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete comment.");

      const removeNode = (nodes: CommentNode[]): boolean => {
        const idx = nodes.findIndex((n) => n.id === id);
        if (idx >= 0) {
          nodes.splice(idx, 1);
          return true;
        }
        return nodes.some((n) => removeNode(n.replies));
      };
      const next = [...tree];
      removeNode(next);
      setTree(next);
      setCount((c) => Math.max(0, c - (data.removed ?? 1)));
      toast.success({ title: "Comment deleted" });
    } catch (err) {
      toast.error({
        title: "Could not delete the comment",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="comments" className="mt-14">
      <h2 className="mb-2 text-xl font-bold text-zinc-100">
        Comments <span className="text-zinc-500">({count})</span>
      </h2>
      <div className="section-bar mb-6" />

      {/* Add comment (top-level) */}
      {viewer ? (
        <CommentTextarea
          placeholder="Share your thoughts…"
          submitLabel="Post comment"
          busy={busy}
          onSubmit={(text) => handleAdd(text, null)}
        />
      ) : (
        <div className="glass mb-6 rounded-xl p-4 text-sm text-zinc-400">
          <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>{" "}
          to join the discussion.
        </div>
      )}

      {/* Tree */}
      {tree.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600">
          No comments yet — be the first to share your thoughts.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-800/60">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              viewer={viewer}
              replyingTo={replyingTo}
              editingId={editingId}
              busy={busy}
              onReply={(id) => setReplyingTo(id === 0 ? null : id)}
              onStartEdit={(id) => {
                setEditingId(id);
                setReplyingTo(null);
              }}
              onEditSubmit={handleEdit}
              onDelete={(id) => setDeleteTarget({ id, isReply: true })}
              onReplySubmit={(parentId, text) => void handleAdd(text, parentId)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this comment?"
        description="The comment and its replies will be removed. This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
