import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SiteOfferCreateForm from "./SiteOfferCreateForm";

export const dynamic = "force-dynamic"; // always re-fetch — dropdown data must be fresh
export const metadata = { title: "New Site Offer — Admin" };

export default async function NewSiteOfferPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        redirect("/app/dashboard");
    }

    // Load dropdown options in parallel
    const [{ data: platforms }, { data: providers }, { data: games }] = await Promise.all([
        supabase.from("platforms").select("id, name").eq("is_active", true).order("name"),
        supabase.from("providers").select("id, name").eq("is_active", true).order("name"),
        supabase.from("games").select("id, name").order("name"),
    ]);

    return (
        <div className="max-w-2xl space-y-6">
            <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/app/admin/site-offers" className="hover:text-gray-700 transition font-medium">
                    ← Manual Offers
                </Link>
                <span>/</span>
                <span className="text-gray-600">New Entry</span>
            </nav>

            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">New Manual Offer</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Curated offers appear in the &ldquo;Compare GPT Sites&rdquo; section on game pages.
                    Link a game, GPT site, and offerwall — then set payout and tasks.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SiteOfferCreateForm
                    platforms={platforms ?? []}
                    providers={providers ?? []}
                    games={games ?? []}
                />
            </div>
        </div>
    );
}
