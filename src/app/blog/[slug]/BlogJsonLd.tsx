// Server component — renders JSON-LD Article + BreadcrumbList schema for a blog post.

interface BlogJsonLdProps {
    post: {
        title: string;
        slug: string;
        excerpt: string | null;
        category: string | null;
        tags: string[] | null;
        featured_image: string | null;
        published_at: string | null;
        updated_at: string;
    };
}

export default function BlogJsonLd({ post }: BlogJsonLdProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://earngrind.com";
    const url     = `${baseUrl}/blog/${post.slug}`;

    const article = {
        "@context":        "https://schema.org",
        "@type":           "Article",
        "headline":        post.title,
        "description":     post.excerpt ?? post.title,
        "url":             url,
        "datePublished":   post.published_at ?? post.updated_at,
        "dateModified":    post.updated_at,
        "author": {
            "@type": "Organization",
            "name":  "EarnGrind",
            "url":   baseUrl,
        },
        "publisher": {
            "@type": "Organization",
            "name":  "EarnGrind",
            "url":   baseUrl,
            "logo": {
                "@type": "ImageObject",
                "url":   `${baseUrl}/logo.png`,
            },
        },
        ...(post.featured_image && {
            "image": {
                "@type": "ImageObject",
                "url":   post.featured_image,
            },
        }),
        ...(post.tags && post.tags.length > 0 && {
            "keywords": post.tags.join(", "),
        }),
        ...(post.category && { "articleSection": post.category }),
        "isPartOf": { "@type": "WebSite", "url": baseUrl, "name": "EarnGrind" },
    };

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type":    "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/blog` },
            { "@type": "ListItem", "position": 3, "name": post.title },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
            />
        </>
    );
}
