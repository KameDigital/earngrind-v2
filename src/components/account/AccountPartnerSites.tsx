import { GPT_AFFILIATE_PLATFORMS, buildTrackedPlatformHref } from "@/lib/gpt-affiliate-platforms";
import PartnerLogo from "@/components/PartnerLogo";

type PartnerConnection = { slug: string; connectedAt: string; lastSignupClickAt: string };
type PartnerSignupCardsProps = {
    connections?: PartnerConnection[];
    variant?: "account" | "homepage";
};

function dateLabel(value: string) {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export default function AccountPartnerSites({ connections = [], variant = "account" }: PartnerSignupCardsProps) {
    const isHomepage = variant === "homepage";
    const bySlug = new Map(connections.map((connection) => [connection.slug, connection]));
    const headingId = isHomepage ? "homepage-partner-signups" : "partner-sites";

    return (
        <section aria-labelledby={headingId} className={isHomepage ? "" : "account-partners"}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Partner signups</p>
                    <h2 id={headingId} className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        {isHomepage ? "Choose your next GPT site" : "Your GPT sites"}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        {isHomepage
                            ? "Start with a trusted reward site using an EarnGrind affiliate link, then complete signup and verification directly with that partner."
                            : "Open a partner from here to use the EarnGrind affiliate signup link. We mark the link as opened; finish signup and any verification directly with that site."}
                    </p>
                </div>
                {!isHomepage && (
                    <span className="w-fit rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800">
                        {connections.length} links opened
                    </span>
                )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {GPT_AFFILIATE_PLATFORMS.map((platform) => {
                    const connection = bySlug.get(platform.slug);
                    const href = buildTrackedPlatformHref(
                        platform,
                        isHomepage ? "homepage_partner_signup" : "account_partner_signup",
                        isHomepage ? "homepage_partner_signup" : "account_partner_signup",
                    );

                    return (
                        <article key={platform.slug} className="relative flex min-h-[320px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-lime-400" />
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <span className="rounded border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-violet-700">
                                    {platform.priority === "primary" ? "Mainstream" : "Partner"}
                                </span>
                                {platform.trustScore != null && (
                                    <span
                                        className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-800"
                                        title="Internal EarnGrind editorial score based on platform stability and payout track record"
                                    >
                                        EarnGrind Rating {platform.trustScore.toFixed(1)}/5
                                    </span>
                                )}
                                {!isHomepage && (
                                    <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-600">
                                        {connection ? "Opened" : "Not started"}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <PartnerLogo
                                    name={platform.name}
                                    slug={platform.slug}
                                    logoUrl={platform.slug === "inboxdollars" ? "/gpt-logo/inboxdollars-mascot.png" : undefined}
                                    className="h-10 w-10 shrink-0"
                                />
                                <div>
                                    <h3 className="font-black text-slate-950">{platform.name}</h3>
                                    <p className="text-xs text-slate-500">{platform.bestFor}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{platform.rewardNote}</p>

                            {(platform.payoutMethods?.length || platform.disclosure) ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {platform.payoutMethods?.map((method) => (
                                        <span key={method} className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                            {method}
                                        </span>
                                    ))}
                                    {platform.disclosure && (
                                        <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                            {platform.disclosure}
                                        </span>
                                    )}
                                </div>
                            ) : null}

                            <div className="mt-4 border-y border-slate-100 py-3 text-[11px] text-slate-500">
                                <span className="font-bold text-slate-700">{isHomepage ? "EarnGrind affiliate link" : "Direct affiliate link"}</span>
                                <br />
                                {isHomepage ? "Ready when you are." : connection ? `First opened ${dateLabel(connection.connectedAt)}` : "Ready when you are."}
                            </div>
                            <a href={href} target="_blank" rel="noopener noreferrer sponsored nofollow" className="mt-auto rounded bg-black px-3 py-3 text-center text-xs font-extrabold text-white transition hover:bg-lime-400 hover:text-black">{connection && !isHomepage ? "Open signup link again" : platform.cta}</a>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}