import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------
// HERO PRODUCT PREVIEW CARDS (static — no data dependency)
// ---------------------------------------------------------------
function HeroPreviewStack() {
  return (
    <div className="relative h-[420px] lg:h-[460px] select-none pointer-events-none">
      {/* === Card 3 (bottom — Guide teaser) === */}
      <div
        className="absolute bottom-0 right-0 w-[76%] bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3.5 shadow-xl"
        style={{ transform: "rotate(3deg) translateY(8px)", zIndex: 1 }}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-lime)]/70 mb-1.5">Strategy Guide</div>
        <div className="text-white font-semibold text-sm leading-snug mb-1">Coin Master Village 50 Complete Guide</div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>⏱ 7–10 days</span>
          <span>·</span>
          <span className="text-[var(--brand-lime)]/80 font-bold">Up to $22.00</span>
        </div>
      </div>

      {/* === Card 2 (middle — Compare) === */}
      <div
        className="absolute bottom-12 left-0 w-[72%] bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-4 shadow-xl"
        style={{ transform: "rotate(-2deg)", zIndex: 2 }}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Payout Comparison</div>
        <div className="space-y-2">
          {[
            { platform: "Swagbucks", payout: "$22.00", best: true },
            { platform: "Freecash", payout: "$14.50", best: false },
            { platform: "InboxDollars", payout: "$9.00", best: false },
          ].map((row) => (
            <div key={row.platform} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.best ? "bg-[var(--brand-lime)]" : "bg-white/20"}`} />
                <span className="text-xs text-white/70 font-medium truncate">{row.platform}</span>
              </div>
              <span className={`text-xs font-extrabold flex-shrink-0 ${row.best ? "text-[var(--brand-lime)]" : "text-white/50"}`}>
                {row.payout}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* === Card 1 (top — Featured offer) === */}
      <div
        className="absolute top-0 right-0 w-[80%] bg-white/[0.08] backdrop-blur border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        style={{ zIndex: 3 }}
      >
        {/* Header bar */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-white/30 font-medium">earngrind.pro/offers</span>
          </div>
        </div>

        {/* Offer row */}
        <div className="px-4 py-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Top Offer Today</div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
              <span className="text-xl">🪙</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-bold text-sm">Coin Master</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)] text-[var(--brand-ink)]">ATH</span>
              </div>
              <div className="text-white/40 text-xs">Swagbucks · 🍎 🤖 🌐</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Up to</div>
              <div className="text-[var(--brand-lime)] font-extrabold text-xl leading-none">$22.00</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[82%] rounded-full bg-[var(--brand-lime)]/60" />
            </div>
            <div className="flex-shrink-0 px-3 py-1.5 bg-[var(--brand-lime)] text-[var(--brand-ink)] text-[11px] font-extrabold rounded-lg">
              Start Offer →
            </div>
          </div>
        </div>
      </div>

      {/* Floating labels */}
      <div
        className="absolute top-[52%] -left-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 shadow-lg"
        style={{ zIndex: 4 }}
      >
        <div className="w-2 h-2 rounded-full bg-[var(--brand-lime)] animate-pulse" />
        <span className="text-white text-[11px] font-semibold whitespace-nowrap">Live data</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// TRUST STRIP
// ---------------------------------------------------------------
const TRUST_ITEMS = [
  { icon: "✓", label: "Free to use" },
  { icon: "✓", label: "No account required" },
  { icon: "✓", label: "Updated every 4 hours" },
  { icon: "✓", label: "Real provider data" },
];

// ---------------------------------------------------------------
// HOMEPAGE
// ---------------------------------------------------------------
export default async function HomePage() {
  const supabase = createClient();

  // Top offers from unified view (ingested + manual) — first 6 by payout
  // is_featured/is_boosted first, then by payout_usd desc as fallback
  const { data: topOffers } = await supabase
    .from("unified_offers_view")
    .select(
      "id, source, game_name, game_slug, game_thumbnail, platform_name, platform_logo, platform_kind, provider_name, payout_usd, is_featured, is_boosted, is_ath, is_hot, heat_score, offer_url"
    )
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("is_boosted", { ascending: false })
    .order("payout_usd", { ascending: false })
    .limit(6);

  // Featured games — now sourced from unified_offers_view so manual-only games are included
  const { data: unifiedOffersSummary } = await supabase
    .from("unified_offers_view")
    .select("game_id, game_name, game_slug, game_thumbnail, payout_usd, is_ath, is_hot")
    .eq("status", "active")
    .order("payout_usd", { ascending: false });

  // Build payout map from unified view
  const payoutMap: Record<string, { max: number; count: number; ath: boolean; hot: boolean; thumbnail: string | null; name: string; slug: string }> = {};
  (unifiedOffersSummary ?? []).forEach((o) => {
    const g = payoutMap[o.game_id];
    if (!g) {
      payoutMap[o.game_id] = {
        max: o.payout_usd,
        count: 1,
        ath: o.is_ath ?? false,
        hot: o.is_hot ?? false,
        thumbnail: o.game_thumbnail,
        name: o.game_name,
        slug: o.game_slug,
      };
    } else {
      g.max = Math.max(g.max, o.payout_usd);
      g.count += 1;
      g.ath = g.ath || (o.is_ath ?? false);
      g.hot = g.hot || (o.is_hot ?? false);
    }
  });

  // Top 6 games by max payout (unified — includes manual-only games)
  const featuredGames = Object.values(payoutMap)
    .sort((a, b) => b.max - a.max)
    .slice(0, 6);

  // Reviews teaser
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, slug, title, excerpt, rating_overall, platforms(name, logo_url)")
    .eq("status", "published")
    .order("rating_overall", { ascending: false })
    .limit(2);

  // Blog teaser
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, category, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen">

      {/* ============================================================ */}
      {/* HERO — dark two-column                                        */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(10,12,10,0.92) 0%, rgba(10,12,10,0.75) 50%, rgba(10,12,10,0.55) 100%),
            url("/hero-home.png")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── LEFT: Messaging ── */}
            <div className="max-w-xl">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-lime)] animate-pulse" />
                <span className="text-[var(--brand-lime)] text-xs font-bold uppercase tracking-wider">
                  Live Offer Data — Updated Daily
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Find the highest{" "}
                <span
                  className="text-[var(--brand-lime)]"
                  style={{ WebkitTextStroke: "0.5px rgba(190,242,100,0.3)" }}
                >
                  paying offers
                </span>{" "}
                <span className="text-white">across every platform</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-[var(--text-tertiary)] text-lg leading-relaxed mb-8 max-w-lg">
                Search, compare, and complete offerwall tasks from Swagbucks, Freecash, InboxDollars, and more — all in one place.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  href="/offers"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-sm rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px active:translate-y-0 shadow-lg shadow-[var(--brand-lime)]/20"
                >
                  Browse All Offers
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white font-bold text-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
                >
                  View Guides
                </Link>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {TRUST_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                    <span className="text-[var(--brand-lime)]/70 font-bold">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product preview ── */}
            <div className="hidden lg:block">
              <HeroPreviewStack />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PLATFORM TRUST STRIP                                          */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-[var(--border-default)] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider whitespace-nowrap">
              Data from
            </span>
            {["Swagbucks", "Freecash", "InboxDollars", "PrizeRebel"].map((name) => (
              <span key={name} className="text-sm font-bold text-[var(--text-tertiary)] hover:text-[var(--brand-ink)] transition-colors">
                {name}
              </span>
            ))}
            <span className="text-xs text-[var(--text-tertiary)]">+ more</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* VALUE PROPS                                                    */}
      {/* ============================================================ */}
      <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="section-label mb-3">Why EarnGrind</p>
            <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
              Everything you need to earn more
            </h2>
            <p className="mt-3 text-[var(--text-secondary)] text-lg leading-relaxed">
              One platform to search, compare, and complete the highest-paying online tasks.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🔍",
                title: "Find the Highest Paying Offers",
                desc: "Search and filter hundreds of offerwall tasks across Freecash, Swagbucks, and more — sorted by payout.",
              },
              {
                icon: "📊",
                title: "Compare Across Platforms",
                desc: "Pin up to 3 offers side-by-side to see which platform pays the most for the same game.",
              },
              {
                icon: "🎮",
                title: "Game-Specific Payout Pages",
                desc: "Every game has its own page showing every active offer, max payout, and step-by-step strategy.",
              },
              {
                icon: "📖",
                title: "Guides & Reviews",
                desc: "Honest, data-driven platform reviews and completion guides so you earn more in less time.",
              },
            ].map((prop) => (
              <div key={prop.title} className="bg-white rounded-2xl border border-[var(--border-default)] p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-muted)] border border-[var(--border-default)] text-xl mb-4">
                  {prop.icon}
                </div>
                <h3 className="font-bold text-[var(--brand-ink)] mb-2 leading-snug">{prop.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TOP OFFERS RIGHT NOW                                          */}
      {/* ============================================================ */}
      {(topOffers ?? []).length > 0 && (
        <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="section-label mb-3">Live Offers</p>
                <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                  Top Offers Right Now
                </h2>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Highest-paying tasks across every platform — updated daily.
                </p>
              </div>
              <Link
                href="/offers"
                className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[var(--brand-ink)] hover:text-lime-700 transition-colors"
              >
                Browse all offers →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(topOffers ?? []).map((offer) => {
                const isManual = offer.source === "manual";
                const href = `/offers/${offer.game_slug}`;
                return (
                  <Link
                    key={offer.id}
                    href={href}
                    className="group eg-card flex items-center gap-4 p-4"
                  >
                    {/* Game thumbnail */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center">
                      {offer.game_thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={offer.game_thumbnail}
                          alt={offer.game_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black text-[var(--text-tertiary)]">
                          {offer.game_name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors truncate text-sm">
                          {offer.game_name}
                        </span>
                        {offer.is_ath && (
                          <span className="flex-shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)] text-[var(--brand-ink)]">
                            ATH
                          </span>
                        )}
                        {!offer.is_ath && offer.is_hot && (
                          <span className="flex-shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                            HOT
                          </span>
                        )}
                        {isManual && (
                          <span className="flex-shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Curated
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] truncate">
                        {offer.platform_name}
                        {isManual && offer.provider_name && (
                          <span className="text-indigo-500"> via {offer.provider_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Payout */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">up to</div>
                      <div className="text-lg font-extrabold text-[color:hsl(84,93%,36%)]">
                        ${Number(offer.payout_usd).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="sm:hidden mt-6 text-center">
              <Link href="/offers" className="text-sm font-bold text-[var(--brand-ink)]">
                Browse all offers →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* FEATURED GAMES                                                 */}
      {/* ============================================================ */}
      {featuredGames.length > 0 && (
        <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="section-label mb-3">Game Offers</p>
                <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                  Popular Games Right Now
                </h2>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Click a game to see every active offer and max payout.
                </p>
              </div>
              <Link href="/offers" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[var(--brand-ink)] hover:text-lime-700 transition-colors">
                View all offers →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredGames.map((game) => (
                <Link
                  key={game.slug}
                  href={`/offers/${game.slug}`}
                  className="group eg-card flex items-center gap-4 p-4"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center">
                    {game.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={game.thumbnail}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[var(--text-tertiary)]">
                        {game.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors truncate text-sm">
                        {game.name}
                      </span>
                      {game.ath && (
                        <span className="flex-shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-lime)] text-[var(--brand-ink)]">
                          ATH
                        </span>
                      )}
                      {!game.ath && game.hot && (
                        <span className="flex-shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {game.count} offer{game.count !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Payout */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">up to</div>
                    <div className="text-lg font-extrabold text-[color:hsl(84,93%,36%)]">
                      ${game.max.toFixed(2)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="sm:hidden mt-6 text-center">
              <Link href="/offers" className="text-sm font-bold text-[var(--brand-ink)]">
                View all offers →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                   */}
      {/* ============================================================ */}
      <section
        className="bg-[var(--brand-ink)] py-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E\")"
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-lime)]/70 mb-3">Simple Process</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">How it works</h2>
            <p className="mt-2 text-white/50 text-lg">Three steps to finding your next payout.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Search for a game or task",
                desc: "Type any game name or browse by platform, device, or payout type.",
              },
              {
                step: "2",
                title: "Pick the best platform",
                desc: "Compare payouts across all platforms in one view. ATH, HOT, and NEW badges highlight the best deals.",
              },
              {
                step: "3",
                title: "Start the offer",
                desc: "Click \"Start Offer\" to go directly to the platform. We track your click so we can keep the data fresh.",
              },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-sm flex items-center justify-center shadow-lg shadow-[var(--brand-lime)]/20">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2 leading-snug">{s.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PLATFORM REVIEWS TEASER                                        */}
      {/* ============================================================ */}
      {(reviews ?? []).length > 0 && (
        <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="section-label mb-3">Platform Reviews</p>
                <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                  Honest, Independent Reviews
                </h2>
                <p className="mt-2 text-[var(--text-secondary)]">Data-driven ratings of every major GPT site.</p>
              </div>
              <Link href="/reviews" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[var(--brand-ink)] hover:text-lime-700 transition-colors">
                View all reviews →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {(reviews ?? []).map((r: {
                id: string;
                slug: string;
                title: string;
                excerpt: string | null;
                rating_overall: number | null;
                platforms: Array<{ name: string; logo_url: string | null }> | null;
              }) => {
                const platform = Array.isArray(r.platforms) ? r.platforms[0] : null;
                return (
                  <Link key={r.id} href={`/review/${r.slug}`} className="group eg-card p-5">
                    <div className="flex items-start gap-4">
                      {platform?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={platform.logo_url}
                          alt={platform.name}
                          className="w-10 h-10 rounded-xl object-contain border border-[var(--border-default)] bg-white p-1 flex-shrink-0"
                        />
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)] uppercase">
                          {platform?.name?.substring(0, 2) ?? "GP"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                            {platform?.name ?? "GPT Site"} Review
                          </span>
                          {r.rating_overall && (
                            <span className="px-1.5 py-0.5 bg-[var(--brand-lime)] text-[var(--brand-ink)] text-[10px] font-extrabold rounded">
                              {r.rating_overall.toFixed(1)}/5
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors leading-snug mb-1 text-sm">
                          {r.title}
                        </h3>
                        {r.excerpt && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                            {r.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-xs font-bold text-lime-700 group-hover:gap-2 transition-all flex items-center gap-1.5">
                      Read full review →
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* BLOG TEASER                                                    */}
      {/* ============================================================ */}
      {(posts ?? []).length > 0 && (
        <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="section-label mb-3">From the Blog</p>
                <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
                  Strategy & Tips
                </h2>
                <p className="mt-2 text-[var(--text-secondary)]">Earnings experiments and offerwall strategies.</p>
              </div>
              <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[var(--brand-ink)] hover:text-lime-700 transition-colors">
                View all posts →
              </Link>
            </div>

            <div className="space-y-3">
              {(posts ?? []).map((p: {
                id: string;
                slug: string;
                title: string;
                excerpt: string | null;
                category: string | null;
                published_at: string | null;
              }) => {
                const date = p.published_at
                  ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : null;
                return (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="group eg-card flex items-center gap-4 p-4"
                  >
                    {p.category && (
                      <span className="flex-shrink-0 hidden sm:block text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 bg-[var(--brand-lime)] text-[var(--brand-ink)] rounded w-20 text-center leading-tight">
                        {p.category}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--brand-ink)] group-hover:text-lime-700 transition-colors text-sm leading-snug">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed line-clamp-1">
                          {p.excerpt}
                        </p>
                      )}
                    </div>
                    {date && <span className="flex-shrink-0 text-xs text-[var(--text-tertiary)] font-medium whitespace-nowrap">{date}</span>}
                    <span className="flex-shrink-0 text-[var(--border-strong)] group-hover:text-lime-500 transition-colors">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* FINAL CTA                                                      */}
      {/* ============================================================ */}
      <section
        className="bg-[var(--brand-ink)] py-20 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E\")",
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 mb-6">
            <span className="text-[var(--brand-lime)] text-xs font-bold uppercase tracking-wider">Start Earning</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Stop guessing which offer pays the most.
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Search live offers, compare payouts, and start earning in minutes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-base rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px shadow-lg shadow-[var(--brand-lime)]/20"
            >
              Browse All Offers →
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold text-base rounded-xl border border-white/20 hover:bg-white/15 transition-all"
            >
              Read Guides
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
