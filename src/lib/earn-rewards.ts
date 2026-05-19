export const EARN_REWARDS_BETA_WARNING =
    "EarnGrind rewards are in beta. Rewards are only credited after provider confirmation and may pend, reject, or reverse.";

export const CONVERSION_STATUSES = ["pending", "approved", "rejected", "reversed"] as const;
export type ConversionStatus = typeof CONVERSION_STATUSES[number];

export function isConversionStatus(value: string): value is ConversionStatus {
    return CONVERSION_STATUSES.includes(value as ConversionStatus);
}

export function formatCents(value: number | null | undefined, currency = "USD"): string {
    const amount = Number(value ?? 0) / 100;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
}

export function formatList(values: string[] | null | undefined): string {
    if (!values || values.length === 0) return "Any";
    return values.join(", ");
}
