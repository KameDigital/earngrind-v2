import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { countInternalLinks } from "@/lib/guide-quality";
import InternalLinksClient from "./InternalLinksClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guide Internal Links | Admin" };

type Suggestion = {
  label: string;
  href: string;
  reason?: string;
  type?: string;
};

export default async function GuideInternalLinksPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const { data: guides } = await supabase
    .from("guides")
    .select("id, title, slug, status, body_md, internal_link_suggestions")
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows = guides ?? [];
  const linkTargets = rows.map((guide) => ({
    id: guide.id,
    href: `/guides/${guide.slug}`,
    incoming: rows.filter((candidate) => (candidate.body_md ?? "").includes(`/guides/${guide.slug}`)).length,
  }));

  const reviewRows = rows
    .map((guide) => {
      const suggestions = Array.isArray(guide.internal_link_suggestions)
        ? guide.internal_link_suggestions as Suggestion[]
        : [];
      const incoming = linkTargets.find((target) => target.id === guide.id)?.incoming ?? 0;
      return {
        id: guide.id,
        title: guide.title,
        slug: guide.slug,
        status: guide.status,
        internalLinkCount: countInternalLinks(guide.body_md),
        incomingLinkCount: incoming,
        suggestions,
      };
    })
    .filter((guide) => guide.internalLinkCount < 2 || guide.incomingLinkCount === 0 || guide.suggestions.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Guide SEO</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Internal Link Manager</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Approve stored link suggestions, fix orphan guides, and insert a Related Guides & Offers section into draft content.
          </p>
        </div>
        <Link href="/app/admin/guides" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">Back to guides</Link>
      </div>
      <InternalLinksClient guides={reviewRows} />
    </div>
  );
}
