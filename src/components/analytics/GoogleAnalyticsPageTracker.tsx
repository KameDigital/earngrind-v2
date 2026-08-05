"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Emits one consistent GA4 page_view for the initial route and every App Router
 * navigation. Query-only changes are intentionally ignored so filters do not
 * create duplicate page views for the same route or leak into analytics.
 */
export default function GoogleAnalyticsPageTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;

        trackEvent("page_view", {
            page_location: `${window.location.origin}${pathname}`,
            page_path: pathname,
            page_title: document.title,
        });
    }, [pathname]);

    return null;
}
