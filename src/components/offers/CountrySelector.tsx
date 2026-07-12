"use client";

import { useState } from "react";
import { getSupportedPublicOfferCountries } from "@/lib/earnlab-countries";

export function CountrySelector({
    activeCountryCode,
    label = "Offer country",
    className = "",
}: {
    activeCountryCode: string;
    label?: string;
    className?: string;
}) {
    const countries = getSupportedPublicOfferCountries();
    const [submitting, setSubmitting] = useState(false);

    return (
        <form
            action="/offers"
            method="GET"
            onSubmit={() => setSubmitting(true)}
            className={`flex flex-wrap items-end gap-2 rounded-none border border-[var(--border-default)] bg-white p-3 shadow-[var(--shadow-card)] ${className}`}
        >
            <div className="min-w-[12rem]">
                <label htmlFor="offer-country-selector" className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {label}
                </label>
                <select
                    id="offer-country-selector"
                    name="country"
                    defaultValue={activeCountryCode}
                    className="h-10 w-full rounded-none border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 pr-8 text-sm font-bold text-[var(--brand-ink)] outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-300/35"
                    aria-describedby="offer-country-selector-note"
                >
                    {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                            {country.name}
                        </option>
                    ))}
                </select>
                <p id="offer-country-selector-note" className="sr-only">
                    Reloads the public offers page with the selected offer country.
                </p>
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="h-10 rounded-none bg-[var(--brand-ink)] px-4 text-sm font-extrabold text-[var(--brand-lime)] transition hover:-translate-y-px hover:bg-[var(--brand-ink)]/90 focus:outline-none focus:ring-2 focus:ring-lime-300/50 disabled:cursor-wait disabled:opacity-70"
            >
                {submitting ? "Applying" : "Apply"}
            </button>
        </form>
    );
}
