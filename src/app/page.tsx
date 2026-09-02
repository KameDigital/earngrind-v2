import type { Metadata } from "next";
import Link from "next/link";
import EarnLabActivityRail from "@/components/offers/EarnLabActivityRail";
import { RevenuePageView } from "@/components/analytics/RevenueEventTracker";
import { JsonLd, buildBreadcrumbList, buildWebsiteSearchAction, buildFAQPage } from "@/lib/seo-schema";
import AccountPartnerSites from "@/components/account/AccountPartnerSites";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
  description:
    "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
    description:
      "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
    url: "https://earngrind.com",
    siteName: "EarnGrind",
    images: [
      {
        url: "/og-earngrind.png",
        width: 1200,
        height: 630,
        alt: "EarnGrind GPT offer discovery, game guides, and platform research",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "EarnGrind | GPT Offer Discovery, Game Guides, and Platform Research",
    description:
      "Use EarnGrind to discover GPT offer paths, compare live payout routes on /offers, browse game hubs, read completion guides, and research trusted GPT sites.",
    images: ["/og-earngrind.png"],
  },
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group eg-card overflow-hidden rounded-lg p-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 select-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold leading-snug text-[var(--brand-ink)] sm:text-base">
          {question}
        </span>
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-tertiary)] transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="-mt-1 px-6 pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {answer}
      </div>
    </details>
  );
}

const HERO_SITE_TAGS = ["Freecash", "Gemsloot", "Gain.gg", "EarnLab", "KashKick", "Swagbucks"] as const;



const HOMEPAGE_FAQS = [
  {
    question: "How do GPT (Get Paid To) offer sites work?",
    answer:
      "GPT sites reward you for completing tasks like playing mobile or desktop games, answering surveys, and trying new apps. EarnGrind tracks and compares live payout routes across platforms so you can choose the highest-paying site before starting an offer.",
  },
  {
    question: "Why are some offers or platforms shown first or marked featured?",
    answer:
      "Featured picks are manually selected based on active payout competitiveness, verified availability, and user popularity. EarnGrind uses direct affiliate links for partner signups and offers, which means we may earn a referral commission if you join or complete an offer through our link, at no extra cost to you.",
  },
  {
    question: "How are offers and platforms vetted for trustworthiness?",
    answer:
      "We evaluate platforms based on confirmed payout methods (such as PayPal, Visa, or Crypto), active reward tracking stability, platform age, user terms, and historical milestone completion evidence before listing them.",
  },
  {
    question: "Which platform is best for beginners?",
    answer:
      "Start with the Best GPT Sites page. It compares beginner-friendly platforms by trust, payout options, and offer quality so you can pick a site before choosing a specific task.",
  },
  {
    question: "How do I actually get paid?",
    answer:
      "Choose an offer on EarnGrind, open the partner platform, complete the task under that platform's rules, then cash out through the platform's own payout system after approval.",
  },
  {
    question: "What's the difference between EarnGrind and Swagbucks?",
    answer:
      "Swagbucks is a rewards platform where you complete offers and cash out. EarnGrind is a comparison tool that helps you find which platform has the better payout before you start.",
  },
  {
    question: "Is EarnGrind free to use?",
    answer:
      "Yes. No account needed to browse EarnGrind. We show comparison data first; partner sites may ask you to create an account only after you click out to complete an offer.",
  },
] as const;

const HOME_LINK_GROUPS = [
  {
    title: "Popular game offer categories",
    links: [
      { href: "/best-gain-gg-offers", label: "Gain.gg offers" },
      { href: "/best-freecash-games", label: "Best Freecash games" },
      { href: "/highest-paying-gpt-games", label: "Highest-paying GPT games" },
      { href: "/best-money-making-games", label: "Money-making games" },
    ],
  },
  {
    title: "Offerwall providers",
    links: [
      { href: "/offers/gain/us/torox", label: "Torox offers" },
      { href: "/offers/gain/us/adgate", label: "AdGate Media" },
      { href: "/offers/gain/us/revu", label: "RevU offers" },
      { href: "/offers/gain/us/lootably", label: "Lootably offers" },
    ],
  },
  {
    title: "EarnLab countries",
    links: [
      { href: "/offers/us", label: "United States offers" },
      { href: "/offers/gb", label: "United Kingdom offers" },
      { href: "/offers/ca", label: "Canada offers" },
      { href: "/offers/au", label: "Australia offers" },
    ],
  },
  {
    title: "Popular hubs",
    links: [
      { href: "/guides/how-to-earn", label: "How-to-earn guides" },
      { href: "/guides/woodoku-blast", label: "Woodoku Blast guide" },
      { href: "/best-gpt-sites", label: "Best GPT sites" },
      { href: "/best-gpt-sites/swagbucks", label: "Swagbucks review" },
    ],
  },
] as const;

function formatPostDate(_value: string | null) {
  return null;
}

export default async function HomePage() {
  const featuredPost: any = null;
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || null;
  const faqSchema = buildFAQPage(HOMEPAGE_FAQS.map(({ question, answer }) => ({ question, answer })));
  const websiteJsonLd = [
    buildWebsiteSearchAction(),
    buildBreadcrumbList([{ name: "Home", path: "/" }]),
    ...(faqSchema ? [faqSchema] : []),
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-muted)]">
      <RevenuePageView routePath="/" routeGroup="homepage" sourceContext="homepage" />
      <JsonLd data={websiteJsonLd} />
      <EarnLabActivityRail />

      <section
        className="relative flex min-h-[430px] items-center overflow-hidden border-b border-black/20 px-4 py-16 sm:px-6 lg:min-h-[500px] lg:px-8"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(4,8,18,0.14) 0%, rgba(5,9,20,0.34) 42%, rgba(3,7,18,0.62) 100%),
            linear-gradient(90deg, rgba(3,7,18,0.58) 0%, rgba(3,7,18,0.28) 28%, rgba(3,7,18,0.16) 50%, rgba(3,7,18,0.32) 72%, rgba(3,7,18,0.62) 100%),
            url("/hero-home.png")
          `,
          backgroundPosition: "center 24%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-slate-950/55 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--brand-lime)] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-lime)]" aria-hidden="true" />
            Direct GPT offer affiliate links
          </p>
          <h1 className="text-[clamp(3.25rem,8vw,6rem)] font-black leading-[0.84] text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)]">
            Earn<span className="text-[var(--brand-lime)]">Grind</span>
          </h1>

          <p className="mt-5 max-w-2xl text-balance text-sm font-semibold leading-relaxed text-white/80 drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] sm:text-base">
            Find the best Get Paid To offer platforms where you can earn rewards by playing games on Mobile and Desktop or Completing Surveys, and much more. All tested and reviewed for you by a seasoned Grinder with Weekly updates on the best and highest rewarded offers to save you time and fill your pockets!
          </p>

          <Link
            href="/offers"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-[var(--brand-lime)] px-5 py-2.5 text-xs font-extrabold text-[var(--brand-ink)] shadow-[0_12px_40px_rgba(130,223,22,0.2)] transition hover:bg-[#9aeb42]"
          >
            Browse verified offers <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>

          <div className="mt-8">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">
              Offers tracked from
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {HERO_SITE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="border border-white/10 bg-slate-950/35 px-3 py-1.5 text-[11px] font-bold text-white/65 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {discordUrl ? (
            <a
              href={discordUrl}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/80 transition-colors hover:text-[var(--brand-lime)]"
              target="_blank"
              rel="noreferrer"
            >
              Join the community →
            </a>
          ) : null}
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AccountPartnerSites variant="homepage" />
        </div>
      </section>




      {featuredPost ? (
        <section className="bg-[var(--surface-muted)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <article className="eg-card p-6 sm:p-7">
              <p className="section-label mb-3">Featured this week</p>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)]">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                      {featuredPost.excerpt}
                    </p>
                  ) : null}
                  {formatPostDate(featuredPost.published_at) ? (
                    <p className="mt-3 text-xs font-semibold text-[var(--text-tertiary)]">
                      {formatPostDate(featuredPost.published_at)}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-white px-4 py-2.5 text-sm font-extrabold text-[var(--brand-ink)] transition hover:border-lime-300 hover:bg-[var(--brand-lime)]/10"
                >
                  Read more →
                </Link>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <p className="section-label mb-3">Knowledgebase</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)]">
              GPT Industry FAQ &amp; SEO Knowledgebase
            </h2>
          </div>

          <div className="space-y-3">
            {HOMEPAGE_FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-default)] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand-ink)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        className="hidden px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background:
            "linear-gradient(160deg, #0d0d12 0%, #1a1a2e 50%, #0d0d12 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Ready to earn your first dollar online?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
            No account needed to browse. We just show you where the money is.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-lime)] px-8 py-4 text-base font-extrabold text-[var(--brand-ink)] shadow-lg shadow-[var(--brand-lime)]/20 transition-all hover:-translate-y-px hover:bg-[color:hsl(84,93%,72%)]"
            >
              Browse Offers - It&apos;s Free
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="mt-5 text-xs font-medium text-white/30">
            No sign-up required to browse EarnGrind. Partner platforms may
            require accounts for their own offers.
          </p>
        </div>
      </section>
    </main>
  );
}
