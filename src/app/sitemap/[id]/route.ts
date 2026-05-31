import {
  buildSitemapShard,
  getSitemapShardIds,
  SITEMAP_REVALIDATE_SECONDS,
  sitemapEntriesToXml,
} from "@/lib/sitemap-builder";

export const revalidate = SITEMAP_REVALIDATE_SECONDS;

export function generateStaticParams() {
  return getSitemapShardIds().map((id) => ({ id: `${id}.xml` }));
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const entries = await buildSitemapShard(params.id);
  const xml = sitemapEntriesToXml(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
