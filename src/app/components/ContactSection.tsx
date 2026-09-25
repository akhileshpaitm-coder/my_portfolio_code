"use client";

import { useState, type FormEvent } from "react";
import { FiMail, FiMapPin, FiBriefcase } from "react-icons/fi";
import { useToast } from "./toast";

// ── Types ────────────────────────────────────
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type Status = "idle" | "sending";

/** Render ==text== segments in cyan (same markup as the About section). */
function ResponseNote({ text }: { text: string }) {
  const parts: Array<{ text: string; cyan: boolean }> = [];
  const re = /==([^=]+)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), cyan: false });
    parts.push({ text: m[1], cyan: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), cyan: false });

  return (
    <p className="text-sm leading-relaxed text-zinc-400">
      {parts.map((p, i) =>
        p.cyan ? (
          <span key={i} className="text-cyan-300">{p.text}</span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </p>
  );
}

// ── Component ────────────────────────────────
export default function ContactSection({
  email,
  location,
  availability,
  responseNote,
}: {
  email: string;
  location: string;
  availability: string;
  responseNote: string;
}) {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const toast = useToast();

  // ── Validation ──────────────────────────────
  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {};

    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Please enter a valid email.";
    if (form.subject.trim().length < 3) next.subject = "Subject must be at least 3 characters.";
    if (form.message.trim().length < 10) next.message = "Message must be at least 10 characters.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("sending");

    // 15-second timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.success) {
        setStatus("idle");
        setForm({ name: "", email: "", subject: "", message: "" });
        toast.success({
          title: "Message sent",
          description: data.message || "Thanks for reaching out — I'll get back to you soon.",
        });
      } else {
        setStatus("idle");
        toast.error({
          title: "Could not send message",
          description: data.errors?.join(" ") || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setStatus("idle");
      toast.error({
        title: "Network error",
        description: "Unable to reach the server. Please try again later.",
      });
    }
  }

  // ── Handlers ────────────────────────────────
  function update<K extends keyof FormData>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      // Clear field error on change
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };
  }

  // ── Input classes ───────────────────────────
  const inputBase =
    "w-full rounded-xl border bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-200 outline-none";
  const inputNormal = "border-zinc-800 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10";
  const inputError = "border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/10";

  function inputCls(field: keyof FormData) {
    return `${inputBase} ${errors[field] ? inputError : inputNormal}`;
  }

  // ── Render ─────────────────────────────────
  return (
    <section id="contact" className="relative px-4 py-28">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-cyan-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
            Contact
          </span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Let&apos;s <span className="gradient-text">Work Together</span>
        </h2>
        <p className="mb-12 max-w-2xl text-zinc-500">
          Have a project in mind or just want to say hello? Drop me a message and I&apos;ll get back to you as soon as possible.
        </p>

        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* ── Contact Info Cards ── */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <h3 className="mb-5 text-sm font-semibold text-zinc-100 uppercase tracking-wider">
                Contact Info
              </h3>
              <div className="space-y-4">
                {[
                  { icon: FiMail, label: "Email", value: email },
                  { icon: FiMapPin, label: "Location", value: location },
                  { icon: FiBriefcase, label: "Availability", value: availability },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs text-zinc-500">{item.label}</div>
                      <div className="text-sm text-zinc-200">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-100 uppercase tracking-wider">
                Quick Response
              </h3>
              <ResponseNote text={responseNote} />
            </div>
          </div>

          {/* ── Form ── */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="glass rounded-2xl p-6 md:p-8"
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={update("name")}
                    className={inputCls("name")}
                    disabled={status === "sending"}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={update("email")}
                    className={inputCls("email")}
                    disabled={status === "sending"}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Subject */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Subject</label>
                  <input
                    type="text"
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={update("subject")}
                    className={inputCls("subject")}
                    disabled={status === "sending"}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell me about your project or idea..."
                    value={form.message}
                    onChange={update("message")}
                    className={`${inputCls("message")} resize-y min-h-[120px]`}
                    disabled={status === "sending"}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "sending"}
                className="group mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
              >
                {status === "sending" ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
