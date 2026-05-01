import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateResearchOpportunityScore } from "@/lib/research-opportunity-score";
import ResearchOpportunitiesClient, { type OpportunityRow } from "./ResearchOpportunitiesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research Opportunities | Admin" };

type OpportunityType = "game" | "platform" | "offer";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function hasArrayData(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

export default async function ResearchOpportunitiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const [
    researchRes,
    guidesRes,
    offersRes,
    gamesRes,
    platformsRes,
  ] = await Promise.all([
    supabase.from("research_entries").select("target_name, type, source_url, extracted_data, tags").limit(1000),
    supabase.from("guides").select("title, status, keyword_target, guide_type, platform_name, game:games(name)").limit(1000),
    supabase.from("unified_offers_view").select("title, game_name, platform_name, provider_name, payout_usd").order("payout_usd", { ascending: false }).limit(1000),
    supabase.from("games").select("name, slug").limit(500),
    supabase.from("platforms").select("name, slug").limit(500),
  ]);

  const targets = new Map<string, {
    targetName: string;
    type: OpportunityType;
    generatorType: "platform" | "game_offer";
    researchEntries: typeof researchRes.data;
    highestPayout: number | null;
    existingGuideCount: number;
    publishedGuideCount: number;
    hasKeywordIntent: boolean;
  }>();

  function ensureTarget(targetName: string, type: OpportunityType, generatorType: "platform" | "game_offer") {
    const cleanName = targetName.trim();
    if (!cleanName) return null;
    const key = `${type}:${normalize(cleanName)}`;
    if (!targets.has(key)) {
      targets.set(key, {
        targetName: cleanName,
        type,
        generatorType,
        researchEntries: [],
        highestPayout: null,
        existingGuideCount: 0,
        publishedGuideCount: 0,
        hasKeywordIntent: true,
      });
    }
    return targets.get(key) ?? null;
  }

  for (const game of gamesRes.data ?? []) {
    ensureTarget(game.name, "game", "game_offer");
  }

  for (const platform of platformsRes.data ?? []) {
    ensureTarget(platform.name, "platform", "platform");
  }

  for (const offer of offersRes.data ?? []) {
    const gameTarget = ensureTarget(offer.game_name ?? offer.title ?? "", "game", "game_offer");
    const platformTarget = ensureTarget(offer.platform_name ?? "", "platform", "platform");
    const offerTarget = ensureTarget(offer.title ?? offer.game_name ?? "", "offer", "game_offer");
    for (const target of [gameTarget, platformTarget, offerTarget]) {
      if (!target) continue;
      const payout = typeof offer.payout_usd === "number" ? offer.payout_usd : null;
      if (payout !== null) target.highestPayout = Math.max(target.highestPayout ?? 0, payout);
    }
  }

  for (const entry of researchRes.data ?? []) {
    const type = entry.type === "platform" ? "platform" : entry.type === "offer" ? "offer" : "game";
    const target = ensureTarget(entry.target_name, type, type === "platform" ? "platform" : "game_offer");
    if (target) target.researchEntries = [...(target.researchEntries ?? []), entry];
  }

  for (const guide of guidesRes.data ?? []) {
    const game = Array.isArray(guide.game) ? guide.game[0] : guide.game;
    const names = [guide.platform_name, game?.name, guide.keyword_target, guide.title].filter(Boolean) as string[];
    for (const target of Array.from(targets.values())) {
      if (!names.some((name) => normalize(name).includes(normalize(target.targetName)) || normalize(target.targetName).includes(normalize(name)))) continue;
      target.existingGuideCount += 1;
      if (guide.status === "published") target.publishedGuideCount += 1;
      if (guide.keyword_target || guide.guide_type) target.hasKeywordIntent = true;
    }
  }

  const rows: OpportunityRow[] = Array.from(targets.entries()).map(([key, target]) => {
    const researchEntries = target.researchEntries ?? [];
    const hasPayoutData = researchEntries.some((entry) => hasArrayData((entry.extracted_data as Record<string, unknown> | null)?.payoutMentions)) || (target.highestPayout ?? 0) > 0;
    const hasComplaintsOrRisks = researchEntries.some((entry) => {
      const extracted = entry.extracted_data as Record<string, unknown> | null;
      return hasArrayData(extracted?.complaints) || hasArrayData(extracted?.risks);
    });
    const opportunity = calculateResearchOpportunityScore({
      hasStoredResearch: researchEntries.length > 0,
      researchSourceCount: researchEntries.length,
      hasPayoutData,
      hasComplaintsOrRisks,
      hasPublishedReview: target.publishedGuideCount > 0,
      highestPayout: target.highestPayout,
      hasKeywordIntent: target.hasKeywordIntent,
    });

    return {
      key,
      targetName: target.targetName,
      type: target.type,
      researchSourceCount: researchEntries.length,
      highestPayout: target.highestPayout,
      existingGuideCount: target.existingGuideCount,
      publishedGuideCount: target.publishedGuideCount,
      score: opportunity.score,
      label: opportunity.label,
      reasons: opportunity.reasons,
      needsResearch: researchEntries.length === 0 && target.publishedGuideCount === 0 && (target.highestPayout ?? 0) >= 100,
      generatorType: target.generatorType,
    };
  }).sort((a, b) => b.score - a.score || (b.highestPayout ?? 0) - (a.highestPayout ?? 0));

  const needsResearchRows = rows.filter((row) => row.needsResearch).slice(0, 25);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Research Locker</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Research Opportunities</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              Prioritize reviews and guides using stored research, payout potential, published-content gaps, and keyword intent.
            </p>
          </div>
          <Link href="/app/admin/research" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">Research Locker</Link>
        </div>
      </section>

      <ResearchOpportunitiesClient rows={rows} needsResearchRows={needsResearchRows} />
    </div>
  );
}
