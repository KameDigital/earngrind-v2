import { Metadata } from "next";
import { LEGAL_EMAIL } from "@/lib/constants";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { buildBreadcrumbList, buildWebPage, JsonLd } from "@/lib/seo-schema";

export const metadata: Metadata = {
    title: "Affiliate Disclosure",
    description: "EarnGrind's affiliate disclosure and how we earn commissions.",
    alternates: canonicalAlternates("/legal/disclosure"),
};

const LAST_UPDATED = "March 24, 2026";

export default function DisclosurePage() {
    const schemas = [
        buildWebPage({
            name: "Affiliate Disclosure",
            path: "/legal/disclosure",
            description: metadata.description as string,
        }),
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Legal", path: "/legal/disclosure" },
            { name: "Affiliate Disclosure", path: "/legal/disclosure" },
        ]),
    ];

    return (
        <>
            <JsonLd data={schemas} />
            <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-lime-600 mb-2">Legal</p>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Affiliate Disclosure</h1>
                <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
            </div>

            <p>
                EarnGrind participates in affiliate marketing programs. This means that some of the links
                on this website are affiliate links — if you click one and sign up or complete an action
                on a third-party platform, we may earn a commission or referral bonus at{" "}
                <strong>no additional cost to you</strong>.
            </p>

            <h2>What This Means</h2>
            <ul>
                <li>Clicking an affiliate link does not cost you anything extra</li>
                <li>Your payout for completing an offer remains the same whether or not you use our link</li>
                <li>We may receive a small commission from the platform, not from your earnings</li>
            </ul>

            <h2>Which Platforms We Partner With</h2>
            <p>
                We may have affiliate or referral relationships with GPT platforms including (but not
                limited to): Swagbucks, Freecash, InboxDollars, OffertoroPrime, GainGG, and others. These
                relationships may change over time.
            </p>

            <h2>Our Editorial Independence</h2>
            <p>
                Affiliate commissions do not influence our offer rankings, payout data, guide recommendations,
                or platform reviews. Our primary goal is to help users find the highest-paying offers,
                regardless of affiliate status. If we have a financial relationship with a platform, we
                strive to disclose this clearly.
            </p>

            <h2>FTC Compliance</h2>
            <p>
                This disclosure is made in accordance with the United States Federal Trade Commission&apos;s
                guidelines on endorsements and testimonials in advertising (16 CFR Part 255).
            </p>

            <h2>Questions</h2>
            <p>
                If you have questions about our affiliate relationships, contact us at{" "}
                <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
            </p>
        </>
    );
}
