"use client";

import { useEffect } from "react";

type GuideEventType =
    | "view"
    | "cta_click"
    | "offer_click"
    | "platform_click"
    | "internal_link_click";

type TrackerPayload = {
    guideId: string;
    guideSlug: string;
    eventType: GuideEventType;
    targetUrl?: string | null;
    metadata?: Record<string, string | number | boolean | null>;
};

function postGuideEvent(payload: TrackerPayload) {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/api/guide-events", blob)) return;
    }

    void fetch("/api/guide-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
    }).catch(() => {
        // Tracking is intentionally non-blocking.
    });
}

function normalizeHref(anchor: HTMLAnchorElement) {
    const rawHref = anchor.getAttribute("href") ?? "";
    if (!rawHref) return "";

    try {
        const parsed = new URL(rawHref, window.location.origin);
        return parsed.origin === window.location.origin
            ? `${parsed.pathname}${parsed.search}${parsed.hash}`
            : parsed.toString();
    } catch {
        return rawHref;
    }
}

function classifyClick(anchor: HTMLAnchorElement): GuideEventType | null {
    const href = normalizeHref(anchor);
    const text = (anchor.textContent ?? "").trim().toLowerCase();
    const buttonLike = anchor.closest("button,[role='button'],.btn") !== null;

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
    if (href.startsWith("/go/platform/")) return "platform_click";
    if (href.startsWith("/go/")) return "offer_click";

    const ctaWords = ["start", "offer", "compare", "browse", "payout", "best route"];
    if (buttonLike || href.startsWith("/offers") || ctaWords.some((word) => text.includes(word))) {
        return "cta_click";
    }

    if (href.startsWith("/") || href.startsWith(window.location.origin)) return "internal_link_click";
    return null;
}

function ctaMetadata(anchor: HTMLAnchorElement) {
    const dataset = anchor.dataset;
    const placement = dataset.ctaPlacement ?? dataset.placement ?? null;
    const variantId = dataset.ctaVariantId ?? null;
    const variantLabel = dataset.ctaVariantLabel ?? null;
    return {
        source: "guide_page",
        link_text: (anchor.textContent ?? "").trim().slice(0, 120),
        cta_variant_id: variantId,
        cta_variant_label: variantLabel,
        cta_variant: variantId ?? dataset.ctaVariant ?? (dataset.guideCta ? "guide_offer_matcher" : null),
        offer_id: dataset.offerId || null,
        platform_id: dataset.platformId || null,
        match_reason: dataset.matchReason || null,
        placement: placement === "top" || placement === "mid" || placement === "bottom" || placement === "fallback"
            ? placement
            : null,
    };
}

export default function GuidePerformanceTracker({
    guideId,
    guideSlug,
}: {
    guideId: string;
    guideSlug: string;
}) {
    useEffect(() => {
        postGuideEvent({
            guideId,
            guideSlug,
            eventType: "view",
            metadata: { source: "guide_page" },
        });

        const onClick = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            const anchor = target?.closest("a[href]");
            if (!(anchor instanceof HTMLAnchorElement)) return;

            const eventType = classifyClick(anchor);
            if (!eventType) return;

            postGuideEvent({
                guideId,
                guideSlug,
                eventType,
                targetUrl: normalizeHref(anchor),
                metadata: ctaMetadata(anchor),
            });
        };

        document.addEventListener("click", onClick, { capture: true });
        return () => document.removeEventListener("click", onClick, { capture: true });
    }, [guideId, guideSlug]);

    return null;
}
