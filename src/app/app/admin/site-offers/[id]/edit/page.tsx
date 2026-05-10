import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import SiteOfferEditForm from "./SiteOfferEditForm";
import SiteOfferTaskList from "./SiteOfferTaskList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Site Offer — Admin" };

export default async function EditSiteOfferPage({
    params,
}: {
    params: { id: string };
}) {
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

    // Fetch offer + tasks in parallel
    const [{ data: offer }, { data: tasks }] = await Promise.all([
        supabase
            .from("site_offers")
            .select(`
                id, title, payout_usd, goal_text, offer_url, status,
                game:games(name),
                site:platforms(name),
                provider:providers(name)
            `)
            .eq("id", params.id)
            .single(),
        supabase
            .from("site_offer_tasks")
            .select("id, sort_order, title, reward_amount, reward_display, task_type, time_limit_text, notes")
            .eq("site_offer_id", params.id)
            .order("sort_order", { ascending: true }),
    ]);

    if (!offer) notFound();

    const game     = Array.isArray(offer.game)     ? offer.game[0]     : offer.game;
    const site     = Array.isArray(offer.site)     ? offer.site[0]     : offer.site;
    const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider;

    return (
        <div className="max-w-2xl space-y-6">
            <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/app/admin/site-offers" className="hover:text-gray-700 transition font-medium">
                    ← Manual Offers
                </Link>
                <span>/</span>
                <span className="text-gray-600 truncate">{offer.title}</span>
            </nav>

            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Manual Offer</h1>
                <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold text-gray-700">{game?.name ?? "—"}</span>
                    {" · "}{site?.name ?? "—"}
                    {" via "}<span className="text-gray-400">{provider?.name ?? "—"}</span>
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Tracked preview
                    </p>
                    <Link
                        href={`/go/${offer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                        Open tracked start URL
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">
                        Uses the same outbound redirect logic as public offer buttons.
                    </p>
                </div>

                <SiteOfferEditForm
                    offer={{
                        id:         offer.id,
                        title:      offer.title,
                        payout_usd: Number(offer.payout_usd),
                        goal_text:  offer.goal_text ?? null,
                        offer_url:  offer.offer_url ?? null,
                        status:     offer.status,
                    }}
                />

                {/* ── Tasks panel ── */}
                <SiteOfferTaskList
                    siteOfferId={params.id}
                    initialTasks={tasks ?? []}
                />
            </div>
        </div>
    );
}
