import {
  getSitemapShardUrls,
  SITEMAP_REVALIDATE_SECONDS,
  sitemapIndexToXml,
} from "@/lib/sitemap-builder";

export const revalidate = SITEMAP_REVALIDATE_SECONDS;

export async function GET() {
  const xml = sitemapIndexToXml(getSitemapShardUrls());

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
