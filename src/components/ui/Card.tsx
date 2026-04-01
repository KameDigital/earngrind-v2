import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    /** Inset reduces padding for more compact layouts */
    compact?: boolean;
    /** Suppress hover lift for static cards */
    static?: boolean;
}

export default function Card({ children, className = "", compact, static: isStatic }: CardProps) {
    const padding = compact ? "p-4 sm:p-5" : "p-6 sm:p-8";
    const hover = isStatic ? "" : "hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 hover:border-[var(--border-strong)]";

    return (
        <div className={`
            relative overflow-hidden rounded-2xl bg-white
            border border-[var(--border-default)]
            shadow-[var(--shadow-card)]
            transition-all duration-200
            ${hover} ${padding} ${className}
        `}>
            {children}
        </div>
    );
}
