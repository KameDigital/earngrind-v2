"use client";

import { AlertTriangle, Check } from "lucide-react";
import { FormEvent, useState } from "react";

type EmailCaptureStatus = "idle" | "loading" | "success" | "error";
type EmailCaptureVariant = "inline" | "stacked";

interface EmailCaptureProps {
  variant?: EmailCaptureVariant;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailCapture({ variant = "inline" }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<EmailCaptureStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isLoading = status === "loading";
  const isStacked = variant === "stacked";
  const formLayout = isStacked
    ? "flex flex-col gap-3"
    : "flex flex-col gap-3 md:flex-row md:items-start";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setStatus("error");
      setErrorMsg("Invalid email");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Unable to subscribe right now.");
      }

      setStatus("success");
      setErrorMsg("");
    } catch (error) {
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Unable to subscribe right now.");
    }
  }

  return (
    <section className="eg-card min-h-[188px] bg-[var(--surface-dark)] p-5 text-[var(--text-inverse)] sm:p-6">
      {status === "success" ? (
        <div className="flex min-h-[136px] items-center gap-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-lime)] text-[var(--brand-ink)]">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-base font-extrabold leading-snug sm:text-lg" role="alert">
            You&apos;re in. Check your inbox for the first list.
          </p>
        </div>
      ) : (
        <div className={isStacked ? "space-y-5" : "grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1fr)] lg:items-center"}>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Get the week&apos;s highest-paying offers
            </h2>
            <p className="mt-2 text-sm font-medium text-[var(--text-tertiary)]">
              Free. No spam. Unsubscribe anytime.
            </p>
          </div>

          <form className={formLayout} onSubmit={handleSubmit} aria-busy={isLoading}>
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor={`email-capture-${variant}`}>
                Email address
              </label>
              <input
                id={`email-capture-${variant}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[var(--brand-lime)]/45 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="you@example.com"
              />
              {status === "error" && errorMsg ? (
                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-[var(--danger)]" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {errorMsg}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--brand-lime)] px-6 py-3.5 text-sm font-extrabold text-[var(--brand-ink)] shadow-lg shadow-[var(--brand-lime)]/20 transition-all hover:-translate-y-px hover:bg-[var(--brand-lime-dark)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Sending..." : "Send me the list"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
