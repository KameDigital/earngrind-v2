"use client";

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

export function getGaMeasurementId(): string | null {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    return measurementId ? measurementId : null;
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
