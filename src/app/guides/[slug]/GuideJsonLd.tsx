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
        guide_type: string | null;
        keyword_intent: string | null;
        video_url?: string | null;
        video_summary?: string | null;
        video_transcript?: string | null;
        video_thumbnail_url?: string | null;
        video_upload_date?: string | null;
    };
    gameName: string;
    gameSlug: string;
    steps: Array<{ heading: string; body: string }>;
    imageUrl?: string | null;
}

export default function GuideJsonLd({ guide, gameName, gameSlug, steps, imageUrl }: GuideJsonLdProps) {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://earngrind.com").replace(/\/$/, "");
    const url = `${baseUrl}/guides/${guide.slug}`;
    const description = guide.excerpt ?? `Completion guide for ${guide.title}. Verify live offer terms before starting.`;
    const absoluteImageUrl = imageUrl
        ? imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
        : null;

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
        ...(absoluteImageUrl ? { image: [absoluteImageUrl] } : {}),
    };

    const proceduralIntent = ["how_to", "task_specific", "payout_specific"].includes(guide.keyword_intent ?? "")
        || ["how_to_earn", "payout_guide"].includes(guide.guide_type ?? "");
    const proceduralHeading = /step|walkthrough|route|how to|complete|strategy/i;
    const proceduralSteps = steps.filter((section) => proceduralHeading.test(section.heading));
    const howToSteps = proceduralSteps.length > 0
        ? proceduralSteps.map((section, index) => ({
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
        }));

    const howTo = proceduralIntent && howToSteps.length > 0 ? {
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
        step: howToSteps,
        tool: [{ "@type": "HowToTool", name: `${gameName} guide` }],
    } : null;

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

    const video = guide.video_url
        ? {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: `${guide.title} video walkthrough`,
            description: guide.video_summary ?? description,
            thumbnailUrl: guide.video_thumbnail_url ? [`${baseUrl}${guide.video_thumbnail_url}`] : undefined,
            uploadDate: guide.video_upload_date ?? guide.updated_at,
            contentUrl: `${baseUrl}${guide.video_url}`,
            embedUrl: `${baseUrl}${guide.video_url}`,
            transcript: guide.video_transcript,
        }
        : null;

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

    const schemas = [article, ...(howTo ? [howTo] : []), breadcrumb, ...(video ? [video] : []), ...(faq ? [faq] : [])];

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
