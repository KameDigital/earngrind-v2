import { Metadata } from "next";
import { LEGAL_EMAIL } from "@/lib/constants";
import { canonicalAlternates } from "@/lib/seo-metadata";
import { buildBreadcrumbList, buildWebPage, JsonLd } from "@/lib/seo-schema";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How EarnGrind collects, uses, and protects your data.",
    alternates: canonicalAlternates("/legal/privacy"),
    robots: { index: true, follow: true },
};

const LAST_UPDATED = "March 24, 2026";

export default function PrivacyPage() {
    const schemas = [
        buildWebPage({
            name: "Privacy Policy",
            path: "/legal/privacy",
            description: metadata.description as string,
        }),
        buildBreadcrumbList([
            { name: "Home", path: "/" },
            { name: "Legal", path: "/legal/privacy" },
            { name: "Privacy Policy", path: "/legal/privacy" },
        ]),
    ];

    return (
        <>
            <JsonLd data={schemas} />
            <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-lime-600 mb-2">Legal</p>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Privacy Policy</h1>
                <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
            </div>

            <h2>1. Who We Are</h2>
            <p>
                EarnGrind (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the website at earngrind.com.
                We help users find and compare mobile game offer payouts across GPT (Get-Paid-To) platforms.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul>
                <li><strong>Usage data</strong> — pages visited, time on page, referral source, browser type, and device type, collected via analytics tools (e.g., Plausible or Google Analytics). This data is anonymous or pseudonymous.</li>
                <li><strong>Account data</strong> — if you create an account, we store your email address and encrypted password via Supabase Auth.</li>
                <li><strong>Cookies</strong> — we use session cookies required for authentication. We do not use tracking cookies for advertising.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <ul>
                <li>To provide and improve the EarnGrind service</li>
                <li>To authenticate registered users</li>
                <li>To understand how visitors use the site (analytics)</li>
                <li>To contact you if you have an account and there is an important update</li>
            </ul>

            <h2>4. Third-Party Services</h2>
            <p>We use the following third-party services, each with their own privacy policies:</p>
            <ul>
                <li><strong>Supabase</strong> — database and authentication hosting</li>
                <li><strong>Vercel</strong> — hosting and CDN</li>
                <li><strong>Analytics providers</strong> — privacy-respecting analytics (no cross-site tracking)</li>
            </ul>
            <p>
                EarnGrind contains links to external GPT platforms (Swagbucks, Freecash, etc.).
                We are not responsible for the privacy practices of those sites.
            </p>

            <h2>5. Affiliate Links</h2>
            <p>
                Some links on EarnGrind are affiliate links. When you click them and complete an action,
                we may earn a commission at no extra cost to you. See our{" "}
                <a href="/legal/disclosure">Affiliate Disclosure</a> for full details.
            </p>

            <h2>6. Data Retention</h2>
            <p>
                We retain account data as long as your account is active. Usage analytics data is
                retained for up to 24 months. You may request deletion of your account data at any time
                by emailing <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
            </p>

            <h2>7. Your Rights (GDPR / CCPA)</h2>
            <p>If you are in the EU, UK, or California, you have the right to:</p>
            <ul>
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
            </ul>
            <p>
                To exercise any of these rights, email us at{" "}
                <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
            </p>

            <h2>8. Children</h2>
            <p>
                EarnGrind is not directed at children under 13. We do not knowingly collect personal
                information from children. If you believe a child has provided us data, please contact us.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
                We may update this Privacy Policy from time to time. We will update the &ldquo;Last updated&rdquo;
                date at the top. Continued use of EarnGrind after changes constitutes acceptance.
            </p>

            <h2>10. Contact</h2>
            <p>
                Questions about this policy? Email us at{" "}
                <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
            </p>
        </>
    );
}
