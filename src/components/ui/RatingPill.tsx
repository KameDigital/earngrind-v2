import React from "react";
import { Star } from "lucide-react";

interface RatingPillProps {
    rating: number;
    max?: number;
    /** Show star icon instead of slash denominator */
    starMode?: boolean;
    size?: "sm" | "md";
}

function ratingColor(rating: number): string {
    if (rating >= 4.5) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (rating >= 3.5) return "bg-[var(--brand-lime)]/20 text-lime-700 border border-lime-200";
    if (rating >= 2.5) return "bg-amber-50 text-amber-700 border border-amber-100";
    return "bg-red-50 text-red-700 border border-red-100";
}

export default function RatingPill({ rating, max = 5, starMode = false, size = "md" }: RatingPillProps) {
    const colorCls = ratingColor(rating);
    const sizeCls = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-3 py-1 text-sm gap-1.5";

    return (
        <div className={`inline-flex items-center rounded-full font-semibold shadow-sm ${colorCls} ${sizeCls}`}>
            {starMode ? (
                <>
                    <Star className="w-3 h-3 fill-current" />
                    <span>{rating.toFixed(1)}</span>
                </>
            ) : (
                <>
                    <span className="font-bold">{rating.toFixed(1)}</span>
                    <span className="opacity-50 font-normal text-xs">/ {max}</span>
                </>
            )}
        </div>
    );
}
