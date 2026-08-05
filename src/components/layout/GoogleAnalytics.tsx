import { getGaMeasurementId } from "@/lib/google-analytics";

export default function GoogleAnalytics() {
    const measurementId = getGaMeasurementId();

    return (
        <>
            <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <script
                id="google-analytics"
                dangerouslySetInnerHTML={{
                    __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    gtag('js', new Date());
                    // App Router navigation is tracked by GoogleAnalyticsPageTracker.
                    // Disable GA4's initial automatic view so the first route and all
                    // client-side routes use the same explicit event contract.
                    gtag('config', '${measurementId}', { send_page_view: false });
                `,
                }}
            />
        </>
    );
}
