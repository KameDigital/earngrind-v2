"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import type { RevenueEntityType, RevenueEventName, RevenueRouteGroup } from "@/lib/revenue-events";

type RevenueTrackingContext = {
    routePath: string;
    routeGroup: RevenueRouteGroup;
    entityType?: RevenueEntityType;
    entityId?: string | null;
    entitySlug?: string | null;
    guideId?: string | null;
    guideSlug?: string | null;
    gameId?: string | null;
    gameSlug?: string | null;
    offerId?: string | null;
    platformId?: string | null;
    platformSlug?: string | null;
    providerId?: string | null;
    providerName?: string | null;
    sourceContext?: string | null;
};

type RevenueEventPayload = RevenueTrackingContext & {
    eventName: RevenueEventName;
    ctaLocation?: string | null;
    targetUrl?: string | null;
    metadata?: Record<string, string | number | boolean>;
};

function randomKey(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getStoredKey(storageKey: string, prefix: string) {
    if (typeof window === "undefined") return null;

    try {
        const existing = window.localStorage.getItem(storageKey);
        if (existing) return existing;
        const next = randomKey(prefix);
        window.localStorage.setItem(storageKey, next);
        return next;
    } catch {
        return null;
    }
}

function getSessionKey() {
    if (typeof window === "undefined") return null;

    try {
        const existing = window.sessionStorage.getItem("eg_session_id");
        if (existing) return existing;
        const next = randomKey("sess");
        window.sessionStorage.setItem("eg_session_id", next);
        return next;
    } catch {
        return null;
    }
}

function getReferrerPath() {
    if (typeof window === "undefined" || !window.document.referrer) return undefined;

    try {
        return new URL(window.document.referrer, window.location.origin).pathname;
    } catch {
        return undefined;
    }
}

function dedupeKey(payload: RevenueEventPayload) {
    return [
        payload.eventName,
        payload.routePath,
        payload.ctaLocation ?? "",
        payload.targetUrl ?? "",
        payload.entityType ?? "",
        payload.entitySlug ?? payload.entityId ?? "",
    ].join("|");
}

function wasTrackedThisSession(payload: RevenueEventPayload) {
    if (typeof window === "undefined") return false;
    if (payload.eventName !== "cta_impression") return false;

    try {
        const key = `eg_rev_${dedupeKey(payload)}`;
        if (window.sessionStorage.getItem(key)) return true;
        window.sessionStorage.setItem(key, "1");
        return false;
    } catch {
        return false;
    }
}

export function trackRevenueEvent(payload: RevenueEventPayload) {
    if (typeof window === "undefined") return;
    if (wasTrackedThisSession(payload)) return;

    const body = {
        event_name: payload.eventName,
        route_path: payload.routePath,
        route_group: payload.routeGroup,
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        entity_slug: payload.entitySlug,
        guide_id: payload.guideId,
        guide_slug: payload.guideSlug,
        game_id: payload.gameId,
        game_slug: payload.gameSlug,
        offer_id: payload.offerId,
        platform_id: payload.platformId,
        platform_slug: payload.platformSlug,
        provider_id: payload.providerId,
        provider_name: payload.providerName,
        cta_location: payload.ctaLocation,
        source_context: payload.sourceContext,
        target_url: payload.targetUrl,
        referrer_path: getReferrerPath(),
        session_key: getSessionKey(),
        visitor_key: getStoredKey("eg_visitor_id", "visitor"),
        metadata: payload.metadata,
    };

    fetch("/api/revenue-events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        keepalive: payload.eventName === "cta_click",
    }).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
            console.debug("[revenue-events] client tracking failed", error);
        }
    });
}

export function RevenuePageView(props: RevenueTrackingContext) {
    useEffect(() => {
        trackRevenueEvent({
            ...props,
            eventName: "page_view",
        });
    }, [
        props.routePath,
        props.routeGroup,
        props.entityType,
        props.entityId,
        props.entitySlug,
        props.guideId,
        props.guideSlug,
        props.gameId,
        props.gameSlug,
        props.offerId,
        props.platformId,
        props.platformSlug,
        props.providerId,
        props.providerName,
        props.sourceContext,
    ]);

    return null;
}

export function RevenueCtaTracker({
    children,
    ctaLocation,
    targetUrl,
    metadata,
    ...context
}: PropsWithChildren<RevenueTrackingContext & {
    ctaLocation: string;
    targetUrl?: string | null;
    metadata?: Record<string, string | number | boolean>;
}>) {
    const ref = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const payload = {
            ...context,
            eventName: "cta_impression" as const,
            ctaLocation,
            targetUrl,
            metadata,
        };

        if (!("IntersectionObserver" in window)) {
            trackRevenueEvent(payload);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                trackRevenueEvent(payload);
                observer.disconnect();
            }
        }, { threshold: 0.2 });

        observer.observe(node);
        return () => observer.disconnect();
    }, [context.routePath, context.routeGroup, context.entityType, context.entityId, context.entitySlug, context.guideId, context.guideSlug, context.gameId, context.gameSlug, context.offerId, context.platformId, context.platformSlug, context.providerId, context.providerName, context.sourceContext, ctaLocation, targetUrl, metadata]);

    return <span ref={ref} className="contents">{children}</span>;
}
