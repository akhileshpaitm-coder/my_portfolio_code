import "server-only";
import nodemailer from "nodemailer";

/** Shared SMTP transporter (credentials from .env.local). */
export function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** Site owner address (used as From/Reply-To for outbound replies). */
export function ownerEmail(): string {
  return process.env.CONTACT_EMAIL || process.env.SMTP_USER || "";
}

/** Tiny HTML escaper for interpolating user text into email templates. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface ReplyEmailInput {
  to: string;
  toName: string;
  subject: string;
  body: string;
  originalSubject: string;
  originalMessage: string;
  originalDate: string;
  /** Message-IDs being replied to (original + prior replies), oldest first. */
  references?: string[];
  /** Message-ID of the email this reply directly follows. */
  inReplyTo?: string | null;
}

/**
 * Send the admin's reply to a contact message with a branded template.
 * When references/inReplyTo are provided, the email is threaded into the
 * same conversation as the visitor's original email (Re: …, grouped by
 * Gmail/Outlook/Apple Mail) instead of arriving as a separate email.
 * Resolves with the Message-ID of the sent email for the thread chain.
 */
export async function sendReplyEmail(
  input: ReplyEmailInput
): Promise<{ messageId: string }> {
  const transporter = getTransporter();
  const from = ownerEmail();
  if (!from) throw new Error("SMTP_FROM_EMAIL/CONTACT_EMAIL is not configured.");

  const info = await transporter.sendMail({
    from: `"Akhilesh Prajapati" <${from}>`,
    to: input.to,
    replyTo: from,
    subject: input.subject,
    // Thread this reply into the original conversation when possible.
    ...(input.inReplyTo ? { inReplyTo: input.inReplyTo } : {}),
    ...(input.references?.length ? { references: input.references.join(" ") } : {}),
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 32px 40px;">
              <h1 style="margin: 0; font-size: 22px; color: #fff; font-weight: 600;">Reply from Akhilesh</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                Regarding: ${escapeHtml(input.originalSubject)}
              </p>
            </div>
            <!-- Reply body -->
            <div style="padding: 32px 40px;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">Hi ${escapeHtml(input.toName)},</p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${escapeHtml(input.body)}
              </div>
            </div>
            <!-- Quoted original -->
            <div style="padding: 0 40px 32px;">
              <div style="border-left: 3px solid #e5e7eb; padding: 12px 16px; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                <p style="margin: 0 0 6px; font-weight: 500; color: #6b7280;">Your message (${escapeHtml(input.originalDate)}):</p>
                <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(input.originalMessage)}</p>
              </div>
            </div>
            <!-- Footer -->
            <div style="padding: 20px 40px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sent via akhileshprajapati.dev
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
  return { messageId: info.messageId };
}
