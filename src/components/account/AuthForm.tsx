export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12"><div className="w-full border border-[var(--border-default)] bg-white p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-extrabold text-[var(--brand-ink)]">{title}</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p><div className="mt-6">{children}</div></div></div>;
}

export function Field({ label, name, type, autoComplete, minLength }: { label: string; name: string; type: string; autoComplete: string; minLength?: number }) {
    return <label className="block text-sm font-bold text-[var(--brand-ink)]">{label}<input name={name} type={type} required autoComplete={autoComplete} minLength={minLength} className="mt-1.5 w-full border border-[var(--border-default)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-ink)]" /></label>;
}

export function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
    return <p className={`mb-4 border px-3 py-2 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>{children}</p>;
}
