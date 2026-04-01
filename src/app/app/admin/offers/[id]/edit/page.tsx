import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import OfferEditForm from "./OfferEditForm";

export const metadata = { title: "Edit Offer — Admin" };

export default async function EditOfferPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Role gate
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
        redirect("/app/dashboard");
    }

    // Load offer
    const { data: offer } = await supabase
        .from("offers")
        .select(`
            id, payout_usd, status, is_featured, is_boosted,
            game:games(name, slug),
            platform:platforms(name, slug)
        `)
        .eq("id", params.id)
        .single();

    if (!offer) notFound();

    const game     = Array.isArray(offer.game)     ? offer.game[0]     : offer.game;
    const platform = Array.isArray(offer.platform) ? offer.platform[0] : offer.platform;

    return (
        <div className="max-w-xl space-y-6">
            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/app/admin/offers" className="hover:text-gray-700 transition font-medium">
                    ← Ingested Offers
                </Link>
                <span>/</span>
                <span className="text-gray-600 truncate">Edit</span>
            </nav>

            {/* ── Page header ── */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Offer</h1>
                <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold text-gray-700">{game?.name ?? "—"}</span>
                    {" · "}{platform?.name ?? "—"}
                    {" — "}
                    Update payout, status, and flags for this ingested offer.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <OfferEditForm
                    offer={{
                        id:          offer.id,
                        payout_usd:  Number(offer.payout_usd),
                        status:      offer.status,
                        is_featured: offer.is_featured ?? false,
                        is_boosted:  offer.is_boosted  ?? false,
                    }}
                />
            </div>
        </div>
    );
}
