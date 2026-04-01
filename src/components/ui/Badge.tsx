import React from "react";

type Variant = "default" | "success" | "warning" | "danger" | "lime" | "purple" | "blue";

interface BadgeProps {
    children: React.ReactNode;
    variant?: Variant;
    className?: string;
}

const VARIANTS: Record<Variant, string> = {
    default: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-default)]",
    success: "bg-[var(--success-bg)] text-emerald-700 border border-[var(--success-border)]",
    warning: "bg-[var(--warning-bg)] text-amber-700 border border-[var(--warning-border)]",
    danger: "bg-red-50 text-red-700 border border-red-100",
    lime: "bg-[var(--brand-lime)] text-[var(--brand-ink)] border border-lime-300/50",
    purple: "bg-purple-50 text-purple-700 border border-purple-100",
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${VARIANTS[variant]} ${className}`}>
            {children}
        </span>
    );
}
