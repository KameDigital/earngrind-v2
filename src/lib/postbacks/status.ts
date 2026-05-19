import { isConversionStatus, type ConversionStatus } from "@/lib/earn-rewards";
import type { ReviewStatus } from "./types";

export function mapProviderStatus(
    providerStatus: string,
    statusMap: Record<string, string> | null | undefined,
): ConversionStatus | null {
    const normalized = providerStatus.trim().toLowerCase();
    const mapped = String(statusMap?.[normalized] ?? statusMap?.[providerStatus] ?? normalized).trim().toLowerCase();
    const internal = mapped === "chargeback" ? "reversed" : mapped;
    return isConversionStatus(internal) ? internal : null;
}

export function evaluateLifecycleTransition(
    existingStatus: ConversionStatus | null | undefined,
    nextStatus: ConversionStatus,
): { reviewStatus: ReviewStatus; reviewReasons: string[] } {
    if (!existingStatus || existingStatus === nextStatus) {
        return { reviewStatus: "clean", reviewReasons: [] };
    }

    const allowed = new Set([
        "pending:approved",
        "pending:rejected",
        "pending:reversed",
        "approved:reversed",
    ]);

    const transition = `${existingStatus}:${nextStatus}`;
    if (allowed.has(transition)) {
        return { reviewStatus: "clean", reviewReasons: [] };
    }

    if (transition === "rejected:approved" || transition === "reversed:approved") {
        return { reviewStatus: "flagged", reviewReasons: [`suspicious_status_transition:${transition}`] };
    }

    return { reviewStatus: "flagged", reviewReasons: [`unexpected_status_transition:${transition}`] };
}

export function mergeReviewState(
    existingReviewStatus: ReviewStatus | null | undefined,
    existingReasons: string[] | null | undefined,
    next: { reviewStatus: ReviewStatus; reviewReasons: string[] },
    extraReasons: string[] = [],
): { reviewStatus: ReviewStatus; reviewReasons: string[] } {
    const reasons = Array.from(new Set([...(existingReasons ?? []), ...next.reviewReasons, ...extraReasons]));
    const reviewStatus = existingReviewStatus === "reviewed" || existingReviewStatus === "ignored"
        ? existingReviewStatus
        : reasons.length > 0 || next.reviewStatus === "flagged"
            ? "flagged"
            : "clean";

    return { reviewStatus, reviewReasons: reasons };
}
