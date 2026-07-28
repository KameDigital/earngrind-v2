import type { MetadataRoute } from "next";
import {
  buildSitemapShard,
  getSitemapShardIds,
  SITEMAP_REVALIDATE_SECONDS,
} from "@/lib/sitemap-builder";

export const revalidate = SITEMAP_REVALIDATE_SECONDS;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shards = await Promise.all(
    getSitemapShardIds().map((id) => buildSitemapShard(id)),
  );

  return shards.flat();
}
