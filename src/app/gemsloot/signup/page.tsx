import Link from "next/link";
import { redirect } from "next/navigation";
import GemslootSignupConfirmation from "@/app/gemsloot/signup/GemslootSignupConfirmation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Finish GemLoot setup", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function safeReturnTo(value: string | undefined): string {
    return value?.startsWith("/go/") ? value : "/offers/gemsloot/us";
}

export default async function GemslootSignupPage({ searchParams }: { searchParams: { returnTo?: string } }) {
    const returnTo = safeReturnTo(searchParams.returnTo);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/gemsloot/signup?returnTo=${encodeURIComponent(returnTo)}`)}`);

    const { data: gemsloot } = await supabase.from("platforms").select("id").eq("slug", "gemsloot").maybeSingle();
    const { data: connection } = gemsloot
        ? await supabase.from("user_gpt_partner_accounts").select("last_signup_click_at, signup_confirmed_at").eq("user_id", user.id).eq("platform_id", gemsloot.id).maybeSingle()
        : { data: null };

    if (connection?.signup_confirmed_at) redirect(returnTo);

    return <main className="min-h-screen bg-slate-50 px-4 py-16 sm:py-24">
        <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">GemLoot offer access</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Finish your GemLoot setup</h1>
            {!connection?.last_signup_click_at ? <>
                <p className="mt-4 text-sm leading-6 text-slate-600">Create your GemLoot account through EarnGrind first. When you return to this page, you can confirm your signup and unlock GemLoot offer links.</p>
                <a href="/go/platform/gemsloot?click_location=gemsloot_offer_gate&source_context=gemsloot_offer_gate" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">Create GemLoot account</a>
            </> : <>
                <p className="mt-4 text-sm leading-6 text-slate-600">We recorded your EarnGrind GemLoot signup-link click. Confirm only if you completed the signup directly with GemLoot. This does not verify GemLoot account approval or eligibility.</p>
                <GemslootSignupConfirmation returnTo={returnTo} />
            </>}
            <p className="mt-5 text-xs leading-5 text-slate-500">EarnGrind stores only this first-party account status. We do not collect or read GemLoot cookies.</p>
            <Link href="/offers/gemsloot/us" className="mt-5 inline-block text-sm font-bold text-slate-700 underline underline-offset-4">Back to GemLoot offers</Link>
        </section>
    </main>;
}
