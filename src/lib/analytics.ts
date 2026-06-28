"use client";

import { getGaMeasurementId as getConfiguredGaMeasurementId } from "@/lib/google-analytics";

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

export function getGaMeasurementId(): string | null {
    return getConfiguredGaMeasurementId();
}

export function isGaEnabled(): boolean {
    return Boolean(getGaMeasurementId());
}

export function trackEvent(eventName: string, params: Record<string, unknown>): void {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
    }

    window.gtag("event", eventName, params);
}
