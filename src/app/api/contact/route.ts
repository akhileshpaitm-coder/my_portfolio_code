import { NextRequest, NextResponse } from "next/server";
import { getTransporter, escapeHtml } from "@/lib/mailer";
import { saveContactMessage, setMessageEmailMessageId } from "@/lib/contact";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // ── Validation ──────────────────────────────────────
    const errors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters.");
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("A valid email address is required.");
    }
    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      errors.push("Subject must be at least 3 characters.");
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      errors.push("Message must be at least 10 characters.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // ── Save to history first (keeps the message even if SMTP fails) ──
    let savedId: number | null = null;
    try {
      savedId = await saveContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
    } catch (dbErr) {
      console.error("Failed to store contact message:", dbErr);
    }

    // ── Send email via SMTP ─────────────────────────────
    // The notification email doubles as the thread anchor: its Message-ID is
    // stored with the message so admin replies continue the same email
    // conversation (In-Reply-To/References) instead of a separate thread.
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${escapeHtml(name)}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || "akhileshpaitm@gmail.com",
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 32px 40px;">
                <h1 style="margin: 0; font-size: 22px; color: #fff; font-weight: 600;">New Contact Message</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                  From your portfolio website
                </p>
              </div>
              <!-- Body -->
              <div style="padding: 32px 40px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-size: 13px; width: 100px;">Name</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-size: 14px; font-weight: 500;">${escapeHtml(name)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-size: 13px;">Email</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #06b6d4; font-size: 14px;">
                      <a href="mailto:${escapeHtml(email)}" style="color: #06b6d4; text-decoration: none;">${escapeHtml(email)}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-size: 13px;">Subject</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-size: 14px; font-weight: 500;">${escapeHtml(subject)}</td>
                  </tr>
                </table>
                <div style="margin-top: 24px;">
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">Message</p>
                  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                    ${escapeHtml(message)}
                  </div>
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
    };

    const info = await transporter.sendMail(mailOptions);

    // Attach the thread anchor to the saved row (no-op if save failed).
    if (savedId !== null && info?.messageId) {
      try {
        await setMessageEmailMessageId(savedId, info.messageId);
      } catch (dbErr) {
        console.error("Failed to store thread anchor Message-ID:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully! I'll get back to you soon.",
    });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { success: false, errors: ["Failed to send message. Please try again later."] },
      { status: 500 },
    );
  }
}

// ── Tiny HTML escaper (kept for route-local template use) ──
// escapeHtml is imported from @/lib/mailer
