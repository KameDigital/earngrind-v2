"use client";

import { useState } from "react";

export default function GemslootSignupConfirmation({ returnTo }: { returnTo: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirmSignup() {
        setPending(true);
        setError(null);
        try {
            const response = await fetch("/api/account/gemsloot-signup-confirmation", { method: "POST" });
            if (!response.ok) throw new Error("Unable to confirm your GemLoot signup right now.");
            window.location.assign(returnTo);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to confirm your GemLoot signup right now.");
            setPending(false);
        }
    }

    return <div className="mt-6 space-y-3">
        <button type="button" onClick={confirmSignup} disabled={pending} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Confirming…" : "I completed my GemLoot signup"}
        </button>
        {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>;
}
