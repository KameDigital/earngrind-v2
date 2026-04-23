import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GuideCreateForm from "./GuideCreateForm";

export const metadata = { title: "New Guide | Admin" };

export default async function NewGuidePage({ searchParams }: { searchParams?: { sourceGuideId?: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    let sourceGuide = null;
    const sourceGuideId = searchParams?.sourceGuideId;
    if (sourceGuideId) {
        const { data } = await supabase
            .from("guides")
            .select("id, title, slug, excerpt, body_md, difficulty, estimated_time, max_payout_usd, tips, key_takeaways, checklist_items, video_url, layout_style, show_related_offers, show_related_guides, seo_title, seo_description")
            .eq("id", sourceGuideId)
            .maybeSingle();
        sourceGuide = data;
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Link href="/app/admin/guides" className="hover:text-gray-700 transition-colors">Guides</Link>
                    <span>/</span>
                    <span className="text-gray-600 font-medium">New</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">New Guide</h1>
                <p className="text-sm text-gray-500 mt-1">Create a step-by-step completion guide for a game.</p>
            </div>
            <GuideCreateForm sourceGuide={sourceGuide} />
        </div>
    );
}
