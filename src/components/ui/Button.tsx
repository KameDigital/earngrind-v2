import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "lime";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
    href?: string;
}

const BASE = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const SIZES = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-sm",
};

const VARIANTS = {
    // lime accent — primary CTA color
    lime: "bg-[var(--brand-lime)] text-[var(--brand-ink)] hover:bg-[var(--brand-lime-dark)] shadow-sm focus-visible:ring-lime-400",
    // ink-filled — strong actions
    primary: "bg-[var(--brand-ink)] text-white hover:bg-gray-800 shadow-sm focus-visible:ring-gray-900",
    // outlined — secondary actions
    secondary: "border border-[var(--border-strong)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:ring-gray-400",
    // no background — tertiary
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:ring-gray-400",
};

export default function Button({
    variant = "primary",
    size = "md",
    children,
    className = "",
    href,
    ...props
}: ButtonProps) {
    const cls = `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;

    if (href) {
        return <Link href={href} className={cls}>{children}</Link>;
    }
    return <button className={cls} {...props}>{children}</button>;
}
