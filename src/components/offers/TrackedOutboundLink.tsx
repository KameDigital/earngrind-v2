"use client";

import { AnchorHTMLAttributes, MouseEvent, PropsWithChildren, useEffect, useRef } from "react";
import { trackRevenueEvent } from "@/components/analytics/RevenueEventTracker";
import { isGaEnabled, trackEvent } from "@/lib/analytics";
import {
    buildRedirectAttributionSearchParams,
    normalizeRedirectAttribution,
    type RedirectAttribution,
} from "@/lib/outbound-attribution";
import { inferRevenueRouteGroup } from "@/lib/revenue-events";

type TrackedOutboundLinkProps = PropsWithChildren<{
    href: string;
    className?: string;
    target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
    rel?: string;
    eventLabel: string;
    offerId?: string | null;
    offerTitle?: string | null;
    gameTitle?: string | null;
    platformName?: string | null;
    providerName?: string | null;
    payoutUsd?: number | null;
    destinationUrl?: string | null;
    location: string;
    sourceContext?: string | null;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}>;

function buildTrackedHref(params: {
    href: string;
    attribution: Partial<RedirectAttribution>;
}): string {
    const { href, attribution } = params;

    if (!href.startsWith("/go/")) {
        return href;
    }

    const [path, hash = ""] = href.split("#", 2);
    const [pathname, queryString = ""] = path.split("?", 2);
    const searchParams = new URLSearchParams(queryString);
    const attributionParams = buildRedirectAttributionSearchParams(
        normalizeRedirectAttribution(attribution),
    );

    attributionParams.forEach((value, key) => {
        searchParams.set(key, value);
    });

    const nextQuery = searchParams.toString();
    return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

export default function TrackedOutboundLink({
    href,
    className,
    target = "_blank",
    rel = "noopener noreferrer sponsored nofollow",
    eventLabel,
    offerId,
    offerTitle,
    gameTitle,
    platformName,
    providerName,
    payoutUsd,
    destinationUrl,
    location,
    sourceContext,
    onClick,
    children,
}: TrackedOutboundLinkProps) {
    const linkRef = useRef<HTMLAnchorElement | null>(null);
    const attribution = normalizeRedirectAttribution({
        offer_id: offerId,
        offer_title: offerTitle,
        game_title: gameTitle,
        platform_name: platformName,
        provider_name: providerName,
        payout_usd: payoutUsd,
        destination_url: destinationUrl,
        click_location: location,
        source_context: sourceContext,
    });

    const trackedHref = buildTrackedHref({
        href,
        attribution: {
            offer_title: attribution.offer_title,
            game_title: attribution.game_title,
            platform_name: attribution.platform_name,
            provider_name: attribution.provider_name,
            payout_usd: attribution.payout_usd,
            destination_url: attribution.destination_url,
            click_location: attribution.click_location ?? location,
            source_context: attribution.source_context,
        },
    });

    function buildRevenuePayload(eventName: "cta_impression" | "cta_click") {
        const routePath = typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/";

        return {
            eventName,
            routePath,
            routeGroup: inferRevenueRouteGroup(routePath),
            entityType: offerId ? "offer" as const : platformName ? "platform" as const : undefined,
            entityId: offerId,
            offerId,
            providerName,
            ctaLocation: attribution.click_location ?? location,
            sourceContext: attribution.source_context ?? sourceContext,
            targetUrl: trackedHref,
            metadata: {
                event_label: eventLabel,
                offer_title: attribution.offer_title ?? "",
                game_title: attribution.game_title ?? "",
                platform_name: attribution.platform_name ?? "",
                payout_usd: attribution.payout_usd ?? 0,
            },
        };
    }

    useEffect(() => {
        const node = linkRef.current;
        if (!node || typeof window === "undefined") return;

        const payload = buildRevenuePayload("cta_impression");

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
    }, [trackedHref, eventLabel, offerId, providerName, platformName, location, sourceContext]);

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        onClick?.(event);

        if (!event.defaultPrevented) {
            trackRevenueEvent(buildRevenuePayload("cta_click"));
        }

        if (event.defaultPrevented || !isGaEnabled()) {
            return;
        }

        const payload = {
            event_category: "offers",
            event_label: eventLabel,
            offer_id: attribution.offer_id,
            offer_title: attribution.offer_title,
            game_title: attribution.game_title,
            platform_name: attribution.platform_name,
            provider_name: attribution.provider_name,
            payout_usd: attribution.payout_usd,
            destination_url: trackedHref,
            click_location: attribution.click_location,
            source_context: attribution.source_context,
        };

        trackEvent("offer_click", payload);
        trackEvent("outbound_redirect", payload);
    }

    return (
        <a
            ref={linkRef}
            href={trackedHref}
            target={target}
            rel={rel}
            className={className}
            onClick={handleClick}
        >
            {children}
        </a>
    );
}
