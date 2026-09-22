import "server-only";
import type { Filter, Sort, WithId } from "mongodb";
import { getDb, getNativeDb, nextId } from "@/lib/db";
import { ContactMessage as ContactMessageEntity, ContactReply as ContactReplyEntity } from "@/lib/entities";

export type MessageStatus = "new" | "read" | "replied";

export interface ContactMessageItem {
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

export type { ContactMessageItem as ContactMessage };

type MessageStored = ContactMessageItem & { _id?: unknown };
type ContactStored = WithId<MessageStored>;

const MESSAGE_PROJECTION = {
  projection: {
    _id: 0,
    id: 1,
    name: 1,
    email: 1,
    subject: 1,
    message: 1,
    status: 1,
    created_at: 1,
    email_message_id: 1,
  },
};

function toMessage(row: MessageStored): ContactMessageItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    created_at: new Date(row.created_at),
    email_message_id: row.email_message_id ?? null,
  };
}

export interface MessagesPageResult {
  messages: ContactMessageItem[];
  /** Count for the active status filter. */
  total: number;
  /** Count across all statuses. */
  allTotal: number;
  counts: Record<MessageStatus, number>;
  page: number;
  totalPages: number;
  pageSize: number;
}

/** Per-status message counts from one aggregation (0 for missing statuses). */
async function getStatusCounts(): Promise<Record<MessageStatus, number>> {
  const db = await getNativeDb();
  const countRows = await db
    .collection("contact_messages")
    .aggregate<{ _id: string; n: number }>([
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ])
    .toArray();
  const counts: Record<MessageStatus, number> = { new: 0, read: 0, replied: 0 };
  for (const row of countRows) {
    const s = row._id as MessageStatus;
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
 * first, then newest-first. Per-status counts come from a single aggregation
 * so the UI can render filter tabs and pagination without loading every row.
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
  const skip = (page - 1) * pageSize;

  const query: Filter<MessageStored> = options.status
    ? { status: options.status }
    : {};
  // Unread first, then newest-first, then highest id — same as the old SQL.
  const sort: Sort = { status_new: -1, created_at: -1, id: -1 };

  const db = await getNativeDb();
  const rows = await db
    .collection("contact_messages")
    .aggregate<MessageStored>([
      { $match: query },
      {
        $addFields: {
          status_new: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: pageSize },
      { $project: MESSAGE_PROJECTION.projection },
    ])
    .toArray();

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
): Promise<ContactMessageItem | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<ContactStored>("contact_messages")
    .findOne({ id }, MESSAGE_PROJECTION);
  return row ? toMessage(row) : null;
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
  const ds = await getDb();
  const repo = ds.getMongoRepository(ContactMessageEntity);
  const id = await nextId("contact_messages");
  const now = new Date();
  await repo.insertOne({
    id,
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    status: "new",
    email_message_id: input.emailMessageId ?? null,
    created_at: now,
    updated_at: now,
  });
  return id;
}

/** new → read, read → new (replied stays replied). */
export async function toggleMessageRead(
  id: number,
  read: boolean
): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(ContactMessageEntity);
  const result = await repo.updateMany(
    { id, status: { $ne: "replied" } },
    { $set: { status: read ? "read" : "new", updated_at: new Date() } }
  );
  return (result.modifiedCount ?? 0) > 0;
}

/** Full reply history for a message, oldest first (thread order). */
export async function getMessageReplies(
  messageId: number
): Promise<ContactReply[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection("contact_replies")
    .find(
      { message_id: messageId },
      {
        projection: {
          _id: 0,
          id: 1,
          message_id: 1,
          subject: 1,
          body: 1,
          created_at: 1,
          email_message_id: 1,
        },
      }
    )
    .sort({ created_at: 1, id: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r.id,
    message_id: r.message_id,
    subject: r.subject,
    body: r.body,
    created_at: new Date(r.created_at),
    email_message_id: r.email_message_id ?? null,
  }));
}

/** Append a reply to the thread and mark the message replied. */
export async function addMessageReply(
  id: number,
  replySubject: string,
  replyBody: string,
  emailMessageId?: string | null
): Promise<boolean> {
  const db = await getNativeDb();

  // The parent must exist — mirrors the old FK constraint behavior.
  const parent = await db
    .collection("contact_messages")
    .findOne({ id }, { projection: { _id: 1 } });
  if (!parent) return false;

  const ds = await getDb();
  const replyRepo = ds.getMongoRepository(ContactReplyEntity);
  const replyId = await nextId("contact_replies");
  await replyRepo.insertOne({
    id: replyId,
    message_id: id,
    subject: replySubject,
    body: replyBody,
    email_message_id: emailMessageId ?? null,
    created_at: new Date(),
  });

  await db
    .collection("contact_messages")
    .updateMany(
      { id, status: { $ne: "replied" } },
      { $set: { status: "replied", updated_at: new Date() } }
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
  const ds = await getDb();
  const repo = ds.getMongoRepository(ContactMessageEntity);
  await repo.updateMany(
    { id },
    { $set: { email_message_id: emailMessageId, updated_at: new Date() } }
  );
}

/**
 * Full chain of email Message-IDs for a message's thread (original first,
 * replies in sent order). Feeds the References header so mail clients keep
 * every reply in the same conversation.
 */
export async function getThreadMessageIds(messageId: number): Promise<string[]> {
  const db = await getNativeDb();
  const msg = await db
    .collection("contact_messages")
    .findOne(
      { id: messageId },
      { projection: { _id: 0, email_message_id: 1 } }
    );
  const replyRows = await db
    .collection("contact_replies")
    .find(
      { message_id: messageId, email_message_id: { $nin: [null, ""] } },
      { projection: { _id: 0, email_message_id: 1 } }
    )
    .sort({ created_at: 1, id: 1 })
    .toArray();
  const ids: string[] = [];
  const original = msg?.email_message_id;
  if (typeof original === "string" && original) ids.push(original);
  for (const r of replyRows) {
    if (typeof r.email_message_id === "string" && r.email_message_id)
      ids.push(r.email_message_id);
  }
  return ids;
}

export async function deleteContactMessage(id: number): Promise<boolean> {
  const db = await getNativeDb();

  // Cascade: remove the thread's replies with the message (was ON DELETE CASCADE).
  await db.collection("contact_replies").deleteMany({ message_id: id });

  const ds = await getDb();
  const repo = ds.getMongoRepository(ContactMessageEntity);
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function countUnreadMessages(): Promise<number> {
  const db = await getNativeDb();
  return db.collection("contact_messages").countDocuments({ status: "new" });
}

/** Newest unread message summary — drives the "new message" toast. */
export async function getLatestUnreadMessage(): Promise<{
  id: number;
  name: string;
  subject: string;
  created_at: Date;
} | null> {
  const db = await getNativeDb();
  const row = await db
    .collection("contact_messages")
    .findOne({ status: "new" }, { ...MESSAGE_PROJECTION, sort: { created_at: -1, id: -1 } });
  return row
    ? { id: row.id, name: row.name, subject: row.subject, created_at: new Date(row.created_at) }
    : null;
}
