export function formatPayoutFreshness(value?: string | null) {
    if (!value) return "Payout freshness unavailable";

    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "Payout freshness unavailable";

    const diffDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));

    if (diffDays === 0) return "Payout checked today";
    if (diffDays === 1) return "Payout checked yesterday";
    if (diffDays < 30) return `Payout checked ${diffDays} days ago`;
    if (diffDays < 60) return "Payout checked over 30 days ago";
    return "Payout may need rechecking";
}

export function formatDataRefreshedLabel(value?: string | null, fallbackValue?: string | Date | null) {
    const label = formatDataRefreshedDate(value) ?? formatDataRefreshedDate(fallbackValue);
    return `Data refreshed: ${label ?? "date unavailable"}`;
}

function formatDataRefreshedDate(value?: string | Date | null) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day:   "numeric",
        year:  "numeric",
        timeZone: "UTC",
    }).format(date);
}

export function payoutFreshnessIsStale(value?: string | null) {
    if (!value) return true;
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return true;
    return Date.now() - timestamp > 30 * 86_400_000;
}
