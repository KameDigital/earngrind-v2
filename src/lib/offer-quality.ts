const DEFAULT_PUBLIC_MIN_PAYOUT = 0.05;

export type DbTaskType = "install" | "milestone" | "purchase" | "signup" | "other";

export function getPublicOfferMinPayout(): number {
    const raw = process.env.MIN_PUBLIC_OFFER_PAYOUT_USD ?? process.env.NEXT_PUBLIC_MIN_PUBLIC_OFFER_PAYOUT_USD;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PUBLIC_MIN_PAYOUT;
}

export function isPublicPayoutEligible(
    payoutUsd: number,
    totalPayoutUsd: number,
    threshold = getPublicOfferMinPayout(),
): boolean {
    return payoutUsd >= threshold && totalPayoutUsd >= threshold;
}

export function normalizeTotalPayout(payoutUsd: number, totalPayoutUsd: number | null | undefined): number {
    if (!Number.isFinite(payoutUsd)) return Number.isFinite(Number(totalPayoutUsd)) ? Number(totalPayoutUsd) : 0;
    const total = Number(totalPayoutUsd);
    if (!Number.isFinite(total)) return payoutUsd;
    return total < payoutUsd ? payoutUsd : total;
}

export function toDbTaskType(value: string | null | undefined): DbTaskType {
    if (value === "install" || value === "milestone" || value === "purchase" || value === "signup") return value;
    return "other";
}

export function inferFallbackTaskType(text: string): DbTaskType {
    const value = text.toLowerCase();
    if (/\bpurchase|buy|deposit|spend|recharge|pack\b/.test(value)) return "purchase";
    if (/\bsign ?up|signup|register|account|join\b/.test(value)) return "signup";
    if (/\breach|complete|level|chapter|stage|mission|milestone|board|village|task\b/.test(value)) return "milestone";
    if (/\binstall|download|open|start|play|launch\b/.test(value)) return "install";
    return "other";
}

export function buildFallbackTaskTitle(title: string, goalText?: string | null): string {
    const text = (goalText || title || "Complete offer").replace(/\s+/g, " ").trim();
    if (!text) return "Complete offer";
    return text.length <= 120 ? text : `${text.slice(0, 117).trim()}...`;
}
