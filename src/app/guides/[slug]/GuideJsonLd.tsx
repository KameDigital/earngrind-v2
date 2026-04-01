// Server component — renders JSON-LD HowTo + BreadcrumbList schema for a guide page.
// No client JS needed; injected as a <script> tag in the <head>.

interface GuideJsonLdProps {
    guide: {
        title: string;
        slug: string;
        excerpt: string | null;
        difficulty: string | null;
        estimated_time: string | null;
        max_payout_usd: number | null;
        tips: string[];
        published_at: string | null;
        updated_at: string;
    };
    gameName: string;
    gameSlug: string;
    steps: Array<{ heading: string; body: string }>;
}

export default function GuideJsonLd({ guide, gameName, gameSlug, steps }: GuideJsonLdProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://earngrind.com";
    const url     = `${baseUrl}/guides/${guide.slug}`;

    // HowTo schema — rich result in Google for step-by-step guides
    const howTo = {
        "@context":   "https://schema.org",
        "@type":      "HowTo",
        "name":       guide.title,
        "description": guide.excerpt ?? `Complete guide to ${guide.title} and earn up to $${guide.max_payout_usd?.toFixed(2) ?? "?"}.`,
        "url":        url,
        ...(guide.max_payout_usd != null && {
            "estimatedCost": {
                "@type":    "MonetaryAmount",
                "currency": "USD",
                "value":    "0",
            },
            "yield": `Up to $${guide.max_payout_usd.toFixed(2)} in earnings`,
        }),
        ...(guide.estimated_time && {
            "totalTime": formatDuration(guide.estimated_time),
        }),
        "datePublished": guide.published_at ?? guide.updated_at,
        "dateModified":  guide.updated_at,
        "step": steps.length > 0
            ? steps.map((s, i) => ({
                "@type":    "HowToStep",
                "position": i + 1,
                "name":     s.heading,
                "text":     s.body.replace(/<[^>]+>/g, "").slice(0, 300),
            }))
            : guide.tips.map((tip, i) => ({
                "@type":    "HowToStep",
                "position": i + 1,
                "name":     `Tip ${i + 1}`,
                "text":     tip,
            })),
        "tool": [
            { "@type": "HowToTool", "name": `${gameName} (mobile game)` },
        ],
    };

    // BreadcrumbList — improves SERP display
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type":    "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",    "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Guides",  "item": `${baseUrl}/guides` },
            { "@type": "ListItem", "position": 3, "name": gameName,  "item": `${baseUrl}/offers/${gameSlug}` },
            { "@type": "ListItem", "position": 4, "name": guide.title },
        ],
    };

    // FAQPage for tips — can unlock FAQ rich results
    const faq = guide.tips.length > 0
        ? {
            "@context": "https://schema.org",
            "@type":    "FAQPage",
            "mainEntity": guide.tips.map(tip => ({
                "@type":          "Question",
                "name":           tip.length > 80 ? tip.slice(0, 80) + "…" : tip,
                "acceptedAnswer": { "@type": "Answer", "text": tip },
            })),
        }
        : null;

    const schemas = [howTo, breadcrumb, ...(faq ? [faq] : [])];

    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}

// Parse "7-10 days", "3 weeks", "2 hours" → ISO 8601 Duration
function formatDuration(time: string): string {
    const t = time.toLowerCase();
    if (t.includes("hour"))  return `PT${t.match(/\d+/)?.[0] ?? 1}H`;
    if (t.includes("day"))   return `P${t.match(/\d+/)?.[0] ?? 7}D`;
    if (t.includes("week"))  return `P${(parseInt(t.match(/\d+/)?.[0] ?? "1")) * 7}D`;
    if (t.includes("month")) return `P${(parseInt(t.match(/\d+/)?.[0] ?? "1")) * 30}D`;
    return "P7D"; // fallback
}
