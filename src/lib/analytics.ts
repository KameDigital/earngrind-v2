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
    if (typeof window === "undefined") {
        return;
    }

    const eventParams = {
        ...params,
        transport_type: "beacon",
    };

    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, eventParams);
        return;
    }

    // The inline GA bootstrap creates dataLayer before gtag.js is available.
    // Queue early client events instead of silently losing them during hydration.
    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(["event", eventName, eventParams]);
    }
}
