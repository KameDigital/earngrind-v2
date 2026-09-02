import Script from "next/script";
import { getGaMeasurementId } from "@/lib/google-analytics";

export default function GoogleAnalytics() {
    const measurementId = getGaMeasurementId();
    if (!measurementId) return null;

    return (
        <>
            <Script
                id="gtm-script"
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    gtag('js', new Date());
                    gtag('config', '${measurementId}', { send_page_view: false });
                `,
                }}
            />
        </>
    );
}
