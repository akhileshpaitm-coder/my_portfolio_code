"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/app/components/toast";
import { loginAction } from "./actions";

/* ─────────────────────────────────────────────
 * Validation rules (shared by blur + submit)
 * ───────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address (e.g. you@example.com).";
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  return undefined;
}

type FieldErrors = { email?: string; password?: string };

/* ─────────────────────────────────────────────
 * Field error styles
 * ───────────────────────────────────────────── */
const inputBase =
  "w-full rounded-xl border bg-zinc-900/60 px-4 py-3 pr-11 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:outline-none focus:ring-2";
const inputOk =
  "border-zinc-800 focus:border-cyan-500/50 focus:ring-cyan-500/20";
const inputErr =
  "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Signing in…" : "Sign In"}
    </button>
  );
}

/**
 * Credentials login form with client-side validation:
 * - validates on blur and again on submit (block invalid submissions)
 * - inline field errors + red ring styling in the site theme
 * - password show/hide toggle
 * - server error (invalid credentials) still displayed from the action state
 */
export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [state, formAction] = useActionState(loginAction, undefined);

  // Server-side error (invalid credentials) → toast.
  const toast = useToast();
  const seenStateRef = useRef<typeof state>(undefined);
  useEffect(() => {
    if (state?.error && state !== seenStateRef.current) {
      seenStateRef.current = state;
      toast.error({ title: "Sign in failed", description: state.error });
    }
  }, [state, toast]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const runEmailValidation = (value: string) => {
    const msg = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: msg }));
    return !msg;
  };

  const runPasswordValidation = (value: string) => {
    const msg = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: msg }));
    return !msg;
  };

  const handleSubmit = (formData: FormData) => {
    // Validate everything on submit; if invalid, mark touched and abort
    const e1 = validateEmail(email);
    const e2 = validatePassword(password);
    setErrors({ email: e1, password: e2 });
    setTouched({ email: true, password: true });
    if (e1 || e2) {
      toast.warning({
        title: "Check your details",
        description: "Please correct the highlighted fields and try again.",
      });
      return;
    }

    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-5" noValidate>
      {/* Preserve the page the user originally requested */}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {/* Server-side error (wrong credentials, DB down, etc.) */}
      {state?.error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) runEmailValidation(e.target.value);
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, email: true }));
              runEmailValidation(email);
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="animate-fade-in mt-2 flex items-center gap-1.5 text-xs text-red-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a.9.9 0 00-.9.9v3.2a.9.9 0 001.8 0V6.9A.9.9 0 0010 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) runPasswordValidation(e.target.value);
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }));
              runPasswordValidation(password);
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`${inputBase} ${errors.password ? inputErr : inputOk}`}
          />
          {/* Show / hide toggle */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {showPassword ? (
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M7.4 7.5C5.2 8.7 3.7 10.6 3 12c1.7 3.4 5 6 9 6 1.6 0 3.1-.4 4.4-1M12 6c4 0 7.3 2.6 9 6-.5 1-1.2 2-2.1 2.9" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c1.7-3.4 5-6 9-6s7.3 2.6 9 6c-1.7 3.4-5 6-9 6s-7.3-2.6-9-6z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="animate-fade-in mt-2 flex items-center gap-1.5 text-xs text-red-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a.9.9 0 00-.9.9v3.2a.9.9 0 001.8 0V6.9A.9.9 0 0010 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
