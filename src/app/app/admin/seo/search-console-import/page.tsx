import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SearchConsoleImportForm from "./SearchConsoleImportForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search Console Import | Admin" };

export default async function SearchConsoleImportPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Search Console Import</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Paste Google Search Console page/query exports to connect impressions, CTR, and rankings to guide optimization.
                    </p>
                </div>
                <Link href="/app/admin/seo/search-console" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                    Search Console Report
                </Link>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Expected columns: <strong>Page</strong>, <strong>Query</strong>, <strong>Clicks</strong>, <strong>Impressions</strong>, <strong>CTR</strong>, and <strong>Position</strong>. Lowercase/flexible variants are accepted.
            </div>
            <SearchConsoleImportForm />
        </div>
    );
}
