"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getContactMessageById,
  getThreadMessageIds,
  toggleMessageRead,
  addMessageReply,
  deleteContactMessage,
} from "@/lib/contact";
import { sendReplyEmail } from "@/lib/mailer";

export interface ReplyFormState {
  error?: string;
  success?: boolean;
}

/** Only admins may manage messages. */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Mark a message read (opening the detail page also does this) or unread. */
export async function toggleReadAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const read = formData.get("read") === "true";
  if (Number.isInteger(id) && id > 0) {
    await toggleMessageRead(id, read);
    revalidatePath("/dashboard/messages");
    revalidatePath(`/dashboard/messages/${id}`);
    // Refresh the layout so the sidebar unread badge updates in place.
    revalidatePath("/dashboard", "layout");
  }
}

export async function deleteMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteContactMessage(id);
    revalidatePath("/dashboard/messages");
    revalidatePath("/dashboard", "layout");
  }
  redirect("/dashboard/messages");
}

/** Send a reply email to the visitor and store it in the history. */
export async function replyToMessageAction(
  _prev: ReplyFormState | undefined,
  formData: FormData
): Promise<ReplyFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage messages." };
  }

  const id = Number(formData.get("id"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid message id." };
  if (!subject) return { error: "Reply subject is required." };
  if (subject.length > 200)
    return { error: "Reply subject must be 200 characters or fewer." };
  if (!body) return { error: "Reply body is required." };

  const message = await getContactMessageById(id);
  if (!message) return { error: "Message not found." };

  //
  // Email threading: the reply must land in the SAME conversation as the
  // visitor's original email (not a separate email). The chain of Message-IDs
  // (original + prior replies) becomes References; the last one becomes
  // In-Reply-To. Subject stays on the "Re: <original>" form — mail clients
  // group by subject, so a custom subject would start a new thread.
  //
  const threadChain = await getThreadMessageIds(id);
  const lastId = threadChain[threadChain.length - 1] ?? null;
  // Mail clients group conversations by subject: keep the "Re: <original>"
  // form so every reply stays in the same thread. A subject that already
  // starts with Re: is kept as written; anything else is normalized.
  const threadSubject = /^re:/i.test(subject.trim())
    ? subject.trim()
    : `Re: ${message.subject}`;

  let sentMessageId: string | null = null;
  try {
    const info = await sendReplyEmail({
      to: message.email,
      toName: message.name,
      subject: threadSubject,
      body,
      originalSubject: message.subject,
      originalMessage: message.message,
      originalDate: new Date(message.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      references: threadChain.length > 0 ? threadChain : undefined,
      inReplyTo: lastId,
    });
    sentMessageId = info.messageId;
  } catch (err) {
    console.error("Reply email failed:", err);
    return {
      error:
        "Failed to send the reply email. Check SMTP settings and try again.",
    };
  }

  const ok = await addMessageReply(id, threadSubject, body, sentMessageId);
  if (!ok) return { error: "Reply sent but could not be saved to history." };

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${id}`);
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/messages/${id}`);
}
