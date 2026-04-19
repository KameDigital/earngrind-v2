import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import GuideEditForm from "./GuideEditForm";

export const metadata = { title: "Edit Guide | Admin" };

export default async function EditGuidePage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: guide } = await supabase.from("guides").select("*").eq("id", params.id).single();

    if (!guide) notFound();

    const { data: game } = await supabase
        .from("games")
        .select("id, name, slug")
        .eq("id", guide.game_id)
        .maybeSingle();

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Link href="/app/admin/guides" className="hover:text-gray-700 transition-colors">Guides</Link>
                    <span>/</span>
                    <span className="text-gray-600 font-medium truncate max-w-[200px]">{guide.title}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Guide</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Status: <span className={`font-semibold ${guide.status === "published" ? "text-green-700" : "text-gray-500"}`}>{guide.status}</span>
                    {guide.published_at && (
                        <> · Published {new Date(guide.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                    )}
                </p>
            </div>
            <GuideEditForm
                guide={guide}
                initialGame={game ? { id: game.id, name: game.name, slug: game.slug } : null}
            />
        </div>
    );
}
