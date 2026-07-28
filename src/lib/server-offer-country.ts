import "server-only";

import { cookies, headers } from "next/headers";
import {
    OFFER_COUNTRY_COOKIE,
    resolvePublicOfferCountry,
    type OfferCountryResolution,
} from "@/lib/offer-country";
import { createClient } from "@/lib/supabase/server";

export async function resolveRequestOfferCountry(): Promise<OfferCountryResolution> {
    const selectedCountryCookie = cookies().get(OFFER_COUNTRY_COOKIE)?.value ?? null;
    let profileCountry: string | null = null;

    // The account preference is intentionally consulted only after a public
    // country selection cookie, so settings never overwrite a browsing choice.
    if (!selectedCountryCookie) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from("profiles").select("country_code").eq("id", user.id).maybeSingle();
            profileCountry = profile?.country_code ?? null;
        }
    }

    return resolvePublicOfferCountry({
        selectedCountryCookie,
        profileCountry,
        requestHeaders: headers(),
    });
}
