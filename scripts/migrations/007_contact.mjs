/**
 * 007 — contact: contact_messages + contact_replies.
 *
 * Mirrors the old MySQL tables:
 *   contact_messages: id, name, email, subject, message,
 *     status('new'|'read'|'replied' default 'new'), email_message_id,
 *     created_at, updated_at.
 *   contact_replies: id, message_id (numeric ContactMessage id), subject,
 *     body, email_message_id, created_at. The old FK ON DELETE CASCADE is
 *     enforced in application code (deleteContactMessage removes replies).
 */
export async function up(db) {
  await db.createCollection("contact_messages").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.createCollection("contact_replies").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("contact_messages")
    .createIndex({ id: 1 }, { unique: true, name: "uq_contact_messages_id" });
  await db
    .collection("contact_messages")
    .createIndex({ status: 1 }, { name: "idx_messages_status" });
  await db
    .collection("contact_messages")
    .createIndex({ created_at: -1 }, { name: "idx_messages_created" });

  await db
    .collection("contact_replies")
    .createIndex({ id: 1 }, { unique: true, name: "uq_contact_replies_id" });
  await db
    .collection("contact_replies")
    .createIndex({ message_id: 1 }, { name: "idx_replies_message" });
  await db
    .collection("contact_replies")
    .createIndex({ created_at: 1 }, { name: "idx_replies_created" });
}
