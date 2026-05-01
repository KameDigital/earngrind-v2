import Link from "next/link";

export function AdminPageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    {eyebrow ? (
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">{eyebrow}</p>
                    ) : null}
                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
                    {description ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
        </section>
    );
}

export function AdminStatCard({
    label,
    value,
    description,
    href,
    tone = "neutral",
}: {
    label: string;
    value: number | string;
    description?: string;
    href?: string;
    tone?: "neutral" | "good" | "warning" | "critical";
}) {
    const toneClass = {
        neutral: "border-gray-200 bg-white",
        good: "border-lime-200 bg-lime-50/50",
        warning: "border-amber-200 bg-amber-50/50",
        critical: "border-red-200 bg-red-50/50",
    }[tone];
    const content = (
        <>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">{typeof value === "number" ? value.toLocaleString() : value}</p>
            {description ? <p className="mt-2 text-sm leading-snug text-gray-500">{description}</p> : null}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`block rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
                {content}
            </Link>
        );
    }

    return <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>{content}</div>;
}

export function AdminPanel({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div>
                    <h2 className="text-base font-extrabold text-gray-950">{title}</h2>
                    {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

export function AdminButtonLink({
    href,
    children,
    variant = "secondary",
}: {
    href: string;
    children: React.ReactNode;
    variant?: "primary" | "secondary";
}) {
    return (
        <Link
            href={href}
            className={
                variant === "primary"
                    ? "inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                    : "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-gray-300 hover:text-gray-950"
            }
        >
            {children}
        </Link>
    );
}
