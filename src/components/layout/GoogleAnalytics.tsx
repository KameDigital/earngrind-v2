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
                    gtag('config', '${measurementId}');
                `,
                }}
            />
        </>
    );
}
