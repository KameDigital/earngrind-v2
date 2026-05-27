"use client";

import { AnchorHTMLAttributes, MouseEvent, PropsWithChildren } from "react";
import { isGaEnabled, trackEvent } from "@/lib/analytics";
import {
    buildRedirectAttributionSearchParams,
    normalizeRedirectAttribution,
    type RedirectAttribution,
} from "@/lib/outbound-attribution";

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
    location,
    sourceContext,
    onClick,
    children,
}: TrackedOutboundLinkProps) {
    const attribution = normalizeRedirectAttribution({
        offer_id: offerId,
        offer_title: offerTitle,
        game_title: gameTitle,
        platform_name: platformName,
        provider_name: providerName,
        payout_usd: payoutUsd,
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
            click_location: attribution.click_location ?? location,
            source_context: attribution.source_context,
        },
    });

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        onClick?.(event);

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
