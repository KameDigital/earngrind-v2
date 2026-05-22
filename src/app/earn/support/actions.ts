"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const ISSUE_TYPES = new Set([
    "missing_reward",
    "wrong_amount",
    "rejected_offer",
    "reversed_reward",
    "other",
]);

type ClickContext = {
    id: string;
    click_id: string | null;
    offer_title: string | null;
    provider_name: string | null;
    earn_offer: { title: string | null } | { title: string | null }[] | null;
    partner: { slug: string | null; name: string | null } | { slug: string | null; name: string | null }[] | null;
};

function cleanOptionalText(value: FormDataEntryValue | null, maxLength: number) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
}

function isUuid(value: string | null) {
    return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

export async function createRewardSupportTicketAction(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const issueType = String(formData.get("issue_type") ?? "");
    const message = cleanOptionalText(formData.get("message"), 3000);
    const proofUrl = cleanOptionalText(formData.get("proof_url"), 500);
    const selectedClickId = cleanOptionalText(formData.get("offer_click_id"), 80);

    if (!ISSUE_TYPES.has(issueType)) {
        redirect("/earn/support?error=invalid_issue");
    }
    if (!message || message.length < 10) {
        redirect("/earn/support?error=message_required");
    }
    if (proofUrl && !/^https?:\/\//i.test(proofUrl)) {
        redirect("/earn/support?error=invalid_proof");
    }

    let clickContext: ClickContext | null = null;

    if (selectedClickId && isUuid(selectedClickId)) {
        const { data: click, error: clickError } = await supabase
            .from("offer_clicks")
            .select(`
                id,
                click_id,
                offer_title,
                provider_name,
                earn_offer:earn_offers(title),
                partner:offer_partners(slug, name)
            `)
            .eq("id", selectedClickId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (clickError || !click) {
            redirect("/earn/support?error=invalid_click");
        }

        clickContext = click as unknown as ClickContext;
    }

    const normalizedPartner = clickContext
        ? Array.isArray(clickContext.partner) ? clickContext.partner[0] : clickContext.partner
        : null;
    const normalizedOffer = clickContext
        ? Array.isArray(clickContext.earn_offer) ? clickContext.earn_offer[0] : clickContext.earn_offer
        : null;

    let conversionEventId: string | null = null;
    if (clickContext) {
        const { data: ledger } = await supabase
            .from("user_reward_ledger")
            .select("conversion_event_id")
            .eq("user_id", user.id)
            .eq("offer_click_id", clickContext.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        conversionEventId = ledger?.conversion_event_id ?? null;
    }

    const { error } = await supabase.from("earn_reward_support_tickets").insert({
        user_id: user.id,
        offer_click_id: clickContext?.id ?? null,
        click_id: clickContext?.click_id ?? null,
        conversion_event_id: conversionEventId,
        provider_slug: normalizedPartner?.slug ?? clickContext?.provider_name ?? null,
        offer_title: clickContext?.offer_title ?? normalizedOffer?.title ?? null,
        issue_type: issueType,
        message,
        proof_url: proofUrl,
    });

    if (error) {
        redirect("/earn/support?error=create_failed");
    }

    revalidatePath("/earn/support");
    redirect("/earn/support?created=1");
}
