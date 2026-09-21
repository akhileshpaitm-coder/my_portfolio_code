import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

export type MessageStatus = "new" | "read" | "replied";

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: Date;
  /** Message-ID of the visitor's contact email — anchors the reply thread. */
  email_message_id?: string | null;
}

/** A single admin reply in a message's thread. */
export interface ContactReply {
  id: number;
  message_id: number;
  subject: string;
  body: string;
  created_at: Date;
  /** Message-ID of the sent reply email — extends the thread chain. */
  email_message_id?: string | null;
}

interface MessageRow extends RowDataPacket, ContactMessage {}

function toMessage(row: MessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    created_at: row.created_at,
    email_message_id: row.email_message_id ?? null,
  };
}

export interface MessagesPageResult {
  messages: ContactMessage[];
  /** Count for the active status filter. */
  total: number;
  /** Count across all statuses. */
  allTotal: number;
  counts: Record<MessageStatus, number>;
  page: number;
  totalPages: number;
  pageSize: number;
}

interface CountRow extends RowDataPacket {
  status: string;
  n: number;
}

/** Per-status message counts from a single GROUP BY (0 for missing statuses). */
async function getStatusCounts(): Promise<Record<MessageStatus, number>> {
  const [countRows] = await pool.query<CountRow[]>(
    "SELECT status, COUNT(*) AS n FROM contact_messages GROUP BY status"
  );
  const counts: Record<MessageStatus, number> = { new: 0, read: 0, replied: 0 };
  for (const row of countRows) {
    const s = row.status as MessageStatus;
    if (s === "new" || s === "read" || s === "replied") counts[s] = Number(row.n);
  }
  return counts;
}

/**
 * Live status counts for the inbox filter tabs (polled by StatusFilterTabs).
 */
export async function getContactStatusCounts(): Promise<{
  counts: Record<MessageStatus, number>;
  allTotal: number;
}> {
  const counts = await getStatusCounts();
  return { counts, allTotal: counts.new + counts.read + counts.replied };
}

/**
 * One page of messages for the admin inbox. Unread ("new") messages sort
 * first, then newest-first. Per-status counts come from a single GROUP BY so
 * the UI can render filter tabs and pagination without loading every row.
 */
export async function getContactMessagesPage(options: {
  status?: MessageStatus;
  page?: number;
  pageSize?: number;
}): Promise<MessagesPageResult> {
  const pageSize = Math.min(
    50,
    Math.max(1, Math.floor(options.pageSize ?? 10))
  );

  // Counts per status (independent of the active filter).
  const counts = await getStatusCounts();
  const allTotal = counts.new + counts.read + counts.replied;
  const total = options.status ? counts[options.status] : allTotal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Clamp bad/deep links into the valid page range.
  const page = Math.min(totalPages, Math.max(1, Math.floor(options.page ?? 1)));
  const offset = (page - 1) * pageSize;

  const where = options.status ? "WHERE status = ?" : "";
  const params = options.status ? [options.status] : [];
  // LIMIT/OFFSET are validated integers interpolated inline (mysql2's query()
  // mishandles placeholder LIMIT values).
  const [rows] = await pool.query<MessageRow[]>(
    `SELECT id, name, email, subject, message, status, created_at
     FROM contact_messages ${where}
     ORDER BY (status = 'new') DESC, created_at DESC, id DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );

  return {
    messages: rows.map(toMessage),
    total,
    allTotal,
    counts,
    page,
    totalPages,
    pageSize,
  };
}

export async function getContactMessageById(
  id: number
): Promise<ContactMessage | null> {
  const [rows] = await pool.query<MessageRow[]>(
    "SELECT id, name, email, subject, message, status, created_at FROM contact_messages WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? toMessage(rows[0]) : null;
}

/** Persist a contact form submission. Returns the new message id. */
export async function saveContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Message-ID of the notification email that announced this message. */
  emailMessageId?: string | null;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO contact_messages (name, email, subject, message, email_message_id) VALUES (?, ?, ?, ?, ?)",
    [input.name, input.email, input.subject, input.message, input.emailMessageId ?? null]
  );
  return result.insertId;
}

/** new → read, read → new (replied stays replied). */
export async function toggleMessageRead(
  id: number,
  read: boolean
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE contact_messages SET status = ? WHERE id = ? AND status <> 'replied'",
    [read ? "read" : "new", id]
  );
  return result.affectedRows > 0;
}

interface ReplyRow extends RowDataPacket, ContactReply {}

/** Full reply history for a message, oldest first (thread order). */
export async function getMessageReplies(
  messageId: number
): Promise<ContactReply[]> {
  const [rows] = await pool.query<ReplyRow[]>(
    "SELECT id, message_id, subject, body, created_at FROM contact_replies WHERE message_id = ? ORDER BY created_at ASC, id ASC",
    [messageId]
  );
  return rows;
}

/** Append a reply to the thread and mark the message replied. */
export async function addMessageReply(
  id: number,
  replySubject: string,
  replyBody: string,
  emailMessageId?: string | null
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO contact_replies (message_id, subject, body, email_message_id) VALUES (?, ?, ?, ?)",
    [id, replySubject, replyBody, emailMessageId ?? null]
  );
  if (result.affectedRows === 0) return false;

  await pool.query(
    "UPDATE contact_messages SET status = 'replied' WHERE id = ? AND status <> 'replied'",
    [id]
  );
  return true;
}

/**
 * Store the Message-ID of the notification email that announced this contact
 * message — the anchor for threading admin replies into the same thread.
 */
export async function setMessageEmailMessageId(
  id: number,
  emailMessageId: string
): Promise<void> {
  await pool.query<ResultSetHeader>(
    "UPDATE contact_messages SET email_message_id = ? WHERE id = ?",
    [emailMessageId, id]
  );
}

/**
 * Full chain of email Message-IDs for a message's thread (original first,
 * replies in sent order). Feeds the References header so mail clients keep
 * every reply in the same conversation.
 */
export async function getThreadMessageIds(messageId: number): Promise<string[]> {
  const [msgRows] = await pool.query<RowDataPacket[]>(
    "SELECT email_message_id FROM contact_messages WHERE id = ? LIMIT 1",
    [messageId]
  );
  const [replyRows] = await pool.query<RowDataPacket[]>(
    "SELECT email_message_id FROM contact_replies WHERE message_id = ? AND email_message_id IS NOT NULL ORDER BY created_at ASC, id ASC",
    [messageId]
  );
  const ids: string[] = [];
  const original = msgRows[0]?.email_message_id;
  if (typeof original === "string" && original) ids.push(original);
  for (const r of replyRows) {
    if (typeof r.email_message_id === "string" && r.email_message_id)
      ids.push(r.email_message_id);
  }
  return ids;
}

export async function deleteContactMessage(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM contact_messages WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

export async function countUnreadMessages(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'new'"
  );
  return Number((rows[0] as { n: number } | undefined)?.n ?? 0);
}

/** Newest unread message summary — drives the "new message" toast. */
export async function getLatestUnreadMessage(): Promise<{
  id: number;
  name: string;
  subject: string;
  created_at: Date;
} | null> {
  const [rows] = await pool.query<MessageRow[]>(
    "SELECT id, name, email, subject, message, status, created_at FROM contact_messages WHERE status = 'new' ORDER BY created_at DESC, id DESC LIMIT 1"
  );
  const row = rows[0];
  return row
    ? { id: row.id, name: row.name, subject: row.subject, created_at: row.created_at }
    : null;
}
