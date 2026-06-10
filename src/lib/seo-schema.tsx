import type { ReactNode } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://earngrind.com");

export type BreadcrumbItem = {
  name: string;
  path?: string;
};

export type ItemListEntry = {
  name: string;
  path?: string;
  description?: string | null;
};

export type FAQEntry = {
  question: string;
  answer: string;
};

function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }): ReactNode {
  const schemas = Array.isArray(data) ? data : [data];
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

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function buildItemList(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { url: absoluteUrl(item.path) } : {}),
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function buildFAQPage(items: FAQEntry[]) {
  const validItems = items.filter((item) => item.question.trim() && item.answer.trim());
  if (validItems.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildOrganization(name: string, path?: string, logoUrl?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    ...(path ? { url: absoluteUrl(path) } : {}),
    ...(logoUrl ? { logo: absoluteUrl(logoUrl) } : {}),
  };
}

export function buildWebsiteSearchAction() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EarnGrind",
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/offers?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildReviewSchema(input: {
  title: string;
  path: string;
  excerpt?: string | null;
  rating?: number | null;
  datePublished?: string | null;
  dateModified?: string | null;
  itemReviewed: Record<string, unknown>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: input.title,
    url: absoluteUrl(input.path),
    ...(input.excerpt ? { reviewBody: input.excerpt } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { "@type": "Organization", name: "EarnGrind" },
    publisher: { "@type": "Organization", name: "EarnGrind" },
    itemReviewed: input.itemReviewed,
    ...(input.rating != null
      ? {
          reviewRating: {
            "@type": "Rating",
            ratingValue: input.rating,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
