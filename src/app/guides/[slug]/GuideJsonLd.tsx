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
    const url = `${baseUrl}/guides/${guide.slug}`;
    const description = guide.excerpt ?? `Completion guide for ${guide.title}. Verify live offer terms before starting.`;

    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description,
        url,
        datePublished: guide.published_at ?? guide.updated_at,
        dateModified: guide.updated_at,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "EarnGrind" },
        publisher: { "@type": "Organization", name: "EarnGrind" },
    };

    const howTo = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: guide.title,
        description,
        url,
        ...(guide.max_payout_usd != null && {
            estimatedCost: {
                "@type": "MonetaryAmount",
                currency: "USD",
                value: "0",
            },
            yield: `Listed payout may be up to $${guide.max_payout_usd.toFixed(2)}, subject to live offer terms`,
        }),
        ...(guide.estimated_time && {
            totalTime: formatDuration(guide.estimated_time),
        }),
        datePublished: guide.published_at ?? guide.updated_at,
        dateModified: guide.updated_at,
        step: steps.length > 0
            ? steps.map((section, index) => ({
                "@type": "HowToStep",
                position: index + 1,
                name: section.heading,
                text: section.body.replace(/<[^>]+>/g, "").slice(0, 300),
            }))
            : guide.tips.map((tip, index) => ({
                "@type": "HowToStep",
                position: index + 1,
                name: `Tip ${index + 1}`,
                text: tip,
            })),
        tool: [{ "@type": "HowToTool", name: `${gameName} guide` }],
    };

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
            { "@type": "ListItem", position: 2, name: "Guides", item: `${baseUrl}/guides` },
            { "@type": "ListItem", position: 3, name: gameName, item: `${baseUrl}/games/${gameSlug}` },
            { "@type": "ListItem", position: 4, name: guide.title },
        ],
    };

    const faqItems = steps
        .filter((section) => /faq/i.test(section.heading))
        .flatMap((section) =>
            Array.from(section.body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)).map((match) => ({
                question: (match[1] ?? "").replace(/<[^>]+>/g, "").trim(),
                answer: (match[2] ?? "").replace(/<[^>]+>/g, "").trim(),
            })),
        )
        .filter((item) => item.question && item.answer);

    const faq = faqItems.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
        }
        : null;

    const schemas = [article, howTo, breadcrumb, ...(faq ? [faq] : [])];

    return (
        <>
            {schemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}

function formatDuration(time: string): string {
    const normalized = time.toLowerCase();
    if (normalized.includes("hour")) return `PT${normalized.match(/\d+/)?.[0] ?? 1}H`;
    if (normalized.includes("day")) return `P${normalized.match(/\d+/)?.[0] ?? 7}D`;
    if (normalized.includes("week")) return `P${(parseInt(normalized.match(/\d+/)?.[0] ?? "1")) * 7}D`;
    if (normalized.includes("month")) return `P${(parseInt(normalized.match(/\d+/)?.[0] ?? "1")) * 30}D`;
    return "P7D";
}
