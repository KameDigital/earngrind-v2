import "server-only";

import { cookies, headers } from "next/headers";
import {
    OFFER_COUNTRY_COOKIE,
    resolvePublicOfferCountry,
    type OfferCountryResolution,
} from "@/lib/offer-country";

export function resolveRequestOfferCountry(explicitCountry?: string | null): OfferCountryResolution {
    return resolvePublicOfferCountry({
        explicitCountry,
        selectedCountryCookie: cookies().get(OFFER_COUNTRY_COOKIE)?.value ?? null,
        requestHeaders: headers(),
    });
}
