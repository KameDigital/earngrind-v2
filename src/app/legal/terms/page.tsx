import { Metadata } from "next";
import { LEGAL_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
    title: "Terms of Service | EarnGrind",
    description: "Terms governing your use of the EarnGrind platform.",
};

const LAST_UPDATED = "March 24, 2026";

export default function TermsPage() {
    return (
        <>
            <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-lime-600 mb-2">Legal</p>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Terms of Service</h1>
                <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
            </div>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing or using EarnGrind (&ldquo;the Service&rdquo;), you agree to be bound by these
                Terms of Service. If you do not agree, do not use the Service.
            </p>

            <h2>2. What EarnGrind Is</h2>
            <p>
                EarnGrind is an informational platform that aggregates and compares payout data from
                third-party GPT (Get-Paid-To) platforms. We do not pay you directly, nor do we operate
                any reward or offerwalls ourselves. All earnings are through the third-party platforms
                whose offers we display.
            </p>

            <h2>3. No Guarantees of Earnings</h2>
            <p>
                Payout amounts shown on EarnGrind are informational and may change at any time without
                notice. We do not guarantee that any offer will be available at the stated payout, that
                you will successfully complete any offer, or that third-party platforms will credit your
                account as expected.
            </p>

            <h2>4. Affiliate Relationships</h2>
            <p>
                EarnGrind participates in affiliate programs. Some links on the site may be affiliate
                links that earn us a commission. See our <a href="/legal/disclosure">Affiliate Disclosure</a>.
                This does not affect our ratings or recommendations.
            </p>

            <h2>5. Accurate Information</h2>
            <p>
                We make reasonable efforts to keep offer data accurate, but we are not responsible for
                inaccurate, outdated, or missing payout information. Always verify current offer terms
                directly on the third-party platform before investing time.
            </p>

            <h2>6. User Accounts</h2>
            <p>
                If you create an account, you are responsible for maintaining the security of your
                credentials. You must not share your account or use another person&apos;s account. We reserve
                the right to terminate accounts that violate these terms.
            </p>

            <h2>7. Prohibited Use</h2>
            <p>You may not use EarnGrind to:</p>
            <ul>
                <li>Scrape, crawl, or systematically extract data without written permission</li>
                <li>Attempt to access admin areas or other users&apos; accounts</li>
                <li>Use the Service for any unlawful purpose</li>
                <li>Post or transmit spam, malware, or harmful content</li>
            </ul>

            <h2>8. Intellectual Property</h2>
            <p>
                All content on EarnGrind — including guides, blog posts, design, and code — is owned
                by EarnGrind or its contributors and is protected by copyright. You may not reproduce,
                redistribute, or create derivative works without express written permission.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
                The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
                We do not warrant that the Service will be uninterrupted, error-free, or free of harmful
                components.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
                To the maximum extent permitted by law, EarnGrind is not liable for any indirect,
                incidental, special, or consequential damages arising from your use of the Service,
                including lost earnings, missed offers, or reliance on inaccurate data.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
                We may modify these Terms at any time. Continued use of the Service after changes
                constitutes acceptance of the new Terms.
            </p>

            <h2>12. Governing Law</h2>
            <p>
                These Terms are governed by the laws of the jurisdiction in which EarnGrind operates,
                without regard to conflict of law principles.
            </p>

            <h2>13. Contact</h2>
            <p>
                Questions about these Terms? Email{" "}
                <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
            </p>
        </>
    );
}
