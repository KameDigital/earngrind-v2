"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children = "Save settings" }: { children?: string }) {
    const { pending } = useFormStatus();
    return <button type="submit" disabled={pending} className="rounded-none bg-[var(--brand-ink)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving…" : children}</button>;
}
