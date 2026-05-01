"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GUIDE_TYPE_LABELS, type GuideType } from "@/lib/seo-guide-templates";

type Quality = {
  score: number;
  wordCount: number;
  h2Count: number;
  internalLinkCount: number;
  requiredErrors: string[];
  optionalWarnings: string[];
};

type PreviewGuideDraft = {
  previewId: string;
  selected: boolean;
  variant: string;
  title: string;
  slug: string;
  keywordTarget: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  bodyHtml: string;
  difficulty: string;
  estimatedCompletionTime: string;
  maxRewardAmount: number | null;
  tips: string[];
  checklistItems: string[];
  internalLinkSuggestions: unknown;
  parsedTasks: unknown;
  guideType: GuideType;
  batchName: string;
  taskListRaw: string;
  gameId: string;
  gameName: string;
  platformName: string;
  quality: Quality;
  angleType?: string | null;
  keywordClusterId?: string | null;
  keywordIntent?: string | null;
  contentSimilarityScore?: number | null;
  needsVariation?: boolean | null;
  reviewType?: ResearchReviewType | string | null;
  researchSummary?: string | null;
  researchConfidenceScore?: number | null;
  sourceUrls?: string[] | null;
  claimsNeedingVerification?: string[] | null;
  pros?: string[] | null;
  cons?: string[] | null;
  reviewRating?: number | null;
  targetName?: string | null;
  opportunityScore?: number | null;
  opportunityLabel?: string | null;
  researchSourceCount?: number | null;
  highestPayout?: number | null;
  targetWarnings?: string[] | null;
  cannibalizationIssues?: Array<{ severity: "block" | "warning"; message: string; type: string }>;
};

type SavedGuideRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  keyword_target: string | null;
  guide_type: string | null;
};

type GeneratorMode = "guide" | "research_review";
type ResearchReviewType = "platform" | "game_offer" | "offerwall" | "comparison";
type ResearchBatchTarget = {
  targetName: string;
  type?: "platform" | "game" | "offer" | "general" | "comparison";
  reviewType?: ResearchReviewType;
  opportunityScore?: number | null;
  opportunityLabel?: string | null;
  researchSourceCount?: number | null;
  highestPayout?: number | null;
};
type PreviewGroup = {
  targetName: string;
  type?: string;
  opportunityScore?: number | null;
  opportunityLabel?: string | null;
  researchSourceCount?: number | null;
  highestPayout?: number | null;
  draftIds: string[];
  warnings?: string[];
};

const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500";

const VARIANT_LABELS: Record<string, string> = {
  main: "Main Guide",
  hardest: "Hardest Task",
  highest_payout: "Highest Payout",
  purchase: "Purchase Strategy",
  worth_it: "Worth-It / ROI",
  research_review: "Research Review",
};

const REVIEW_TYPE_LABELS: Record<ResearchReviewType, string> = {
  platform: "Platform Review",
  game_offer: "Game Offer Review",
  offerwall: "Offerwall Review",
  comparison: "Comparison Review",
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300">
      <span>
        <span className="block text-sm font-bold text-gray-900">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span>
      </span>
      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-gray-900" : "bg-gray-200"}`}>
        <span className={`h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}

function updateDraftField<K extends keyof PreviewGuideDraft>(
  drafts: PreviewGuideDraft[],
  previewId: string,
  key: K,
  value: PreviewGuideDraft[K],
) {
  return drafts.map((draft) => draft.previewId === previewId ? { ...draft, [key]: value } : draft);
}

function researchConfidenceLabel(score: number | null | undefined) {
  if (typeof score !== "number") return null;
  if (score >= 90) return "Strong research";
  if (score >= 70) return "Good research";
  if (score >= 50) return "Needs editor review";
  return "Thin research";
}

function reviewTypeFromQuery(value: string | null): ResearchReviewType {
  if (value === "platform") return "platform";
  if (value === "offer" || value === "game") return "game_offer";
  if (value === "comparison") return "comparison";
  return "platform";
}

function decodeTargets(value: string | null): ResearchBatchTarget[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((target) => ({
        targetName: String(target.targetName ?? "").trim(),
        type: target.type,
        reviewType: target.reviewType,
        opportunityScore: typeof target.opportunityScore === "number" ? target.opportunityScore : null,
        opportunityLabel: target.opportunityLabel ? String(target.opportunityLabel) : null,
        researchSourceCount: typeof target.researchSourceCount === "number" ? target.researchSourceCount : null,
        highestPayout: typeof target.highestPayout === "number" ? target.highestPayout : null,
      }))
      .filter((target) => target.targetName);
  } catch {
    return [];
  }
}

export default function BatchGuideGenerator() {
  const searchParams = useSearchParams();
  const initialTargets = decodeTargets(searchParams.get("targets"));
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>(searchParams.get("mode") === "research_review" ? "research_review" : "guide");
  const [batchName, setBatchName] = useState(searchParams.get("batchName") ?? "");
  const [guideType, setGuideType] = useState<GuideType>("game_offer");
  const [reviewType, setReviewType] = useState<ResearchReviewType>(reviewTypeFromQuery(searchParams.get("type")));
  const [targetName, setTargetName] = useState(searchParams.get("target") ?? initialTargets[0]?.targetName ?? "");
  const [gameName, setGameName] = useState("");
  const [platform, setPlatform] = useState("");
  const [maxPayout, setMaxPayout] = useState("");
  const [numberOfGuides, setNumberOfGuides] = useState("50");
  const [taskListRaw, setTaskListRaw] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [sourceUrlsRaw, setSourceUrlsRaw] = useState("");
  const [useStoredResearch, setUseStoredResearch] = useState(searchParams.get("useStoredResearch") !== "0");
  const [generateFromTaskList, setGenerateFromTaskList] = useState(true);
  const [createMultipleLongTail, setCreateMultipleLongTail] = useState(searchParams.get("createMultipleLongTail") !== "0");
  const [aggressiveMode, setAggressiveMode] = useState(searchParams.get("aggressiveMode") !== "0");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDrafts, setPreviewDrafts] = useState<PreviewGuideDraft[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<ResearchBatchTarget[]>(initialTargets);
  const [previewGroups, setPreviewGroups] = useState<PreviewGroup[]>([]);
  const [savedGuides, setSavedGuides] = useState<SavedGuideRow[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const selectedCount = useMemo(() => previewDrafts.filter((draft) => draft.selected).length, [previewDrafts]);
  const duplicateKeywords = useMemo(() => {
    const counts = new Map<string, number>();
    previewDrafts.forEach((draft) => counts.set(draft.keywordTarget, (counts.get(draft.keywordTarget) ?? 0) + 1));
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([keyword]) => keyword));
  }, [previewDrafts]);

  async function handlePreview() {
    setPreviewing(true);
    setError(null);
    setSavedGuides([]);

    try {
      const response = await fetch("/api/admin/guides/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          generatorMode,
          batchName,
          guideType,
          reviewType,
          targetName,
          targets: selectedTargets,
          gameName,
          platform,
          maxPayout,
          numberOfGuides,
          taskListRaw,
          researchNotes,
          sourceUrls: sourceUrlsRaw,
          useStoredResearch,
          generateFromTaskList,
          createMultipleLongTail,
          aggressiveMode,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Preview generation failed.");
      setPreviewDrafts(Array.isArray(json.drafts) ? json.drafts : []);
      setPreviewGroups(Array.isArray(json.groups) ? json.groups : []);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Preview generation failed.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSaveSelected() {
    setSaving(true);
    setError(null);

    try {
      const selectedDrafts = previewDrafts.filter((draft) => draft.selected);
      const response = await fetch("/api/admin/guides/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          generatorMode,
          batchName,
          guideType,
          platform,
          drafts: selectedDrafts,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Save failed.");
      setSavedGuides(Array.isArray(json.guides) ? json.guides : []);
      setPreviewDrafts([]);
      setPreviewGroups([]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function removeTarget(targetNameToRemove: string) {
    setSelectedTargets((targets) => targets.filter((target) => target.targetName !== targetNameToRemove));
  }

  function selectAll(selected: boolean) {
    setPreviewDrafts((drafts) => drafts.map((draft) => ({ ...draft, selected })));
  }

  function removeDuplicateKeywordTargets() {
    const seen = new Set<string>();
    setPreviewDrafts((drafts) => drafts.map((draft) => {
      if (!draft.keywordTarget || !seen.has(draft.keywordTarget)) {
        seen.add(draft.keywordTarget);
        return draft;
      }
      return { ...draft, selected: false };
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">SEO Draft Engine</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Generate Guides</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Generate preview drafts first, deselect weak ideas, edit metadata, then save only selected guides as drafts.
            </p>
          </div>
          <Link href="/app/admin/guides" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-gray-300">
            Back to guides
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-gray-900">Batch settings</h2>
            {generatorMode === "research_review" && selectedTargets.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-lime-200 bg-lime-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">Selected batch targets</div>
                    <div className="mt-1 text-xs text-gray-600">Previews will be generated once for each target below.</div>
                  </div>
                  <button type="button" onClick={() => setSelectedTargets([])} className="rounded-lg border border-lime-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">Clear targets</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTargets.map((target) => (
                    <span key={target.targetName} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
                      {target.targetName}
                      {typeof target.opportunityScore === "number" ? <span className="text-lime-700">{target.opportunityScore}</span> : null}
                      <button type="button" onClick={() => removeTarget(target.targetName)} className="text-gray-400 hover:text-red-600">x</button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Generator Mode</label>
                <select value={generatorMode} onChange={(event) => setGeneratorMode(event.target.value as GeneratorMode)} className={inputClass}>
                  <option value="guide">Task/List SEO Guides</option>
                  <option value="research_review">Research-Based Review</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Batch Name</label>
                <input value={batchName} onChange={(event) => setBatchName(event.target.value)} className={inputClass} placeholder="April guide expansion" />
              </div>
              {generatorMode === "research_review" ? (
                <>
                  <div>
                    <label className={labelClass}>Review Type</label>
                    <select value={reviewType} onChange={(event) => setReviewType(event.target.value as ResearchReviewType)} className={inputClass}>
                      {Object.entries(REVIEW_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Target Name</label>
                    <input value={targetName} onChange={(event) => setTargetName(event.target.value)} className={inputClass} placeholder="GAIN.GG, Raid: Shadow Legends, Torox, Freecash vs EarnLab" />
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelClass}>Guide Type</label>
                  <select value={guideType} onChange={(event) => setGuideType(event.target.value as GuideType)} className={inputClass}>
                    {Object.entries(GUIDE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Game Name (optional)</label>
                <input value={gameName} onChange={(event) => setGameName(event.target.value)} className={inputClass} placeholder="Raid: Shadow Legends" />
              </div>
              <div>
                <label className={labelClass}>Platform (optional)</label>
                <input value={platform} onChange={(event) => setPlatform(event.target.value)} className={inputClass} placeholder="EarnLab, Freecash, Gemsloot" />
              </div>
              <div>
                <label className={labelClass}>Max Payout (optional)</label>
                <input value={maxPayout} onChange={(event) => setMaxPayout(event.target.value)} className={inputClass} placeholder="125.00" inputMode="decimal" />
              </div>
              <div>
                <label className={labelClass}>Number of Guides</label>
                <input value={numberOfGuides} onChange={(event) => setNumberOfGuides(event.target.value)} className={inputClass} type="number" min={1} max={100} />
                <p className="mt-1 text-xs text-gray-400">Default 50, hard capped at 100.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {generatorMode === "research_review" ? (
              <div className="space-y-4">
                <Toggle checked={useStoredResearch} onChange={setUseStoredResearch} label="Use Stored Research" description="Pull matching Research Locker entries for this target, platform, or game and inject them into the review draft." />
                <div>
                  <label className={labelClass}>Research Notes</label>
                  <textarea value={researchNotes} onChange={(event) => setResearchNotes(event.target.value)} rows={8} className={`${inputClass} leading-relaxed`} placeholder={"Paste payout notes, trust signals, complaints, support issues, payment methods, competitors, VPN/tracking warnings, and editor observations."} />
                </div>
                <div>
                  <label className={labelClass}>Source URLs</label>
                  <textarea value={sourceUrlsRaw} onChange={(event) => setSourceUrlsRaw(event.target.value)} rows={4} className={`${inputClass} font-mono leading-relaxed`} placeholder={"https://example.com/review\nhttps://example.com/terms"} />
                </div>
                <div>
                  <label className={labelClass}>Payout / Task List Input</label>
                  <textarea value={taskListRaw} onChange={(event) => setTaskListRaw(event.target.value)} rows={10} className={`${inputClass} font-mono leading-relaxed`} placeholder={"Register and start playing the game\n370\nComplete the tutorial\n37\nReach level 50 within 20 days\n28,120"} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Toggle checked={generateFromTaskList} onChange={setGenerateFromTaskList} label="Generate From Task List" description="Use pasted milestones to shape tables, FAQ, stopping points, and strategy sections." />
                  <Toggle checked={createMultipleLongTail} onChange={setCreateMultipleLongTail} label="Create Multiple Long-Tail Guides" description="Create main, hardest task, payout task, purchase strategy, and worth-it draft angles." />
                  <Toggle checked={aggressiveMode} onChange={setAggressiveMode} label="Aggressive SEO Mode" description="Uses stronger guide language, better conversion CTAs, ROI callouts, and clearer what-to-do-first strategy while still avoiding guaranteed payout claims." />
                </div>
                <div className="mt-4">
                  <label className={labelClass}>Task List Input</label>
                  <textarea value={taskListRaw} onChange={(event) => setTaskListRaw(event.target.value)} rows={12} className={`${inputClass} font-mono leading-relaxed`} placeholder={"Register and start playing the game\n370\nComplete the tutorial\n37\nReach level 50 within 20 days\n28,120"} />
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-gray-900">Preview-first workflow</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
              <li>Preview does not create database records.</li>
              <li>Only selected drafts are saved.</li>
              <li>Saved guides are hardcoded as draft.</li>
              <li>Weak duplicate keywords can be deselected before saving.</li>
            </ul>
          </div>

          <button type="button" onClick={handlePreview} disabled={previewing || saving} className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
            {previewing ? "Generating preview..." : generatorMode === "research_review" ? "Research + Generate Review" : "Generate Preview"}
          </button>

          {previewDrafts.length > 0 ? (
            <button type="button" onClick={handleSaveSelected} disabled={saving || selectedCount === 0} className="w-full rounded-2xl bg-lime-500 px-5 py-4 text-sm font-extrabold text-gray-950 shadow-sm transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving drafts..." : `Save Selected Drafts (${selectedCount})`}
            </button>
          ) : null}

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
        </aside>
      </section>

      {previewDrafts.length > 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Preview generated guides</h2>
              <p className="mt-1 text-sm text-gray-500">{selectedCount} of {previewDrafts.length} selected. Nothing is saved until you click Save Selected Drafts.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => selectAll(true)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Select all</button>
              <button type="button" onClick={() => selectAll(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Deselect all</button>
              <button type="button" onClick={removeDuplicateKeywordTargets} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Remove duplicate keyword targets</button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {previewDrafts.map((draft) => {
              const isExpanded = Boolean(expanded[draft.previewId]);
              const hasDuplicateKeyword = duplicateKeywords.has(draft.keywordTarget);
              const confidenceLabel = researchConfidenceLabel(draft.researchConfidenceScore);
              const group = previewGroups.find((item) => item.draftIds.includes(draft.previewId));
              const isFirstInGroup = Boolean(group && group.draftIds[0] === draft.previewId);
              return (
                <div key={draft.previewId}>
                {isFirstInGroup && group ? (
                  <div className="border-b border-gray-100 bg-gray-50 p-5">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900">{group.targetName}</h3>
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {group.type ?? "target"} | {group.researchSourceCount ?? 0} research sources | {group.highestPayout ? `$${group.highestPayout.toFixed(2)} highest payout` : "no payout attached"}
                        </p>
                      </div>
                      {typeof group.opportunityScore === "number" ? (
                        <span className="rounded-full bg-lime-100 px-3 py-1.5 text-xs font-extrabold text-lime-900">{group.opportunityScore} | {group.opportunityLabel ?? "Opportunity"}</span>
                      ) : null}
                    </div>
                    {group.warnings?.length ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                        {group.warnings.join(" ")}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <article className={`p-5 ${draft.selected ? "bg-white" : "bg-gray-50 opacity-70"}`}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <input type="checkbox" checked={draft.selected} onChange={(event) => setPreviewDrafts((drafts) => updateDraftField(drafts, draft.previewId, "selected", event.target.checked))} />
                      Select
                    </label>
                    <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input value={draft.title} onChange={(event) => setPreviewDrafts((drafts) => updateDraftField(drafts, draft.previewId, "title", event.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Slug</label>
                        <input value={draft.slug} onChange={(event) => setPreviewDrafts((drafts) => updateDraftField(drafts, draft.previewId, "slug", event.target.value))} className={`${inputClass} font-mono`} />
                      </div>
                      <div>
                        <label className={labelClass}>Keyword Target</label>
                        <input value={draft.keywordTarget} onChange={(event) => setPreviewDrafts((drafts) => updateDraftField(drafts, draft.previewId, "keywordTarget", event.target.value))} className={`${inputClass} ${hasDuplicateKeyword ? "border-amber-300 bg-amber-50" : ""}`} />
                      </div>
                      <div>
                        <label className={labelClass}>SEO Title</label>
                        <input value={draft.seoTitle} onChange={(event) => setPreviewDrafts((drafts) => updateDraftField(drafts, draft.previewId, "seoTitle", event.target.value))} className={inputClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>SEO Description</label>
                        <input value={draft.seoDescription} onChange={(event) => setPreviewDrafts((drafts) => updateDraftField(drafts, draft.previewId, "seoDescription", event.target.value))} className={inputClass} />
                      </div>
                    </div>
                    <div className="min-w-[180px] space-y-2 text-xs text-gray-500">
                      <span className="inline-flex rounded-full bg-lime-100 px-2 py-1 font-bold text-lime-900">{VARIANT_LABELS[draft.variant] ?? draft.variant}</span>
                      <div>Score: <span className="font-bold text-gray-900">{draft.quality.score}</span>/100</div>
                      {confidenceLabel ? <div>Research: <span className="font-bold text-gray-900">{draft.researchConfidenceScore}</span>/100 {confidenceLabel}</div> : null}
                      {draft.reviewType ? <div>{REVIEW_TYPE_LABELS[draft.reviewType as ResearchReviewType] ?? draft.reviewType}</div> : null}
                      {draft.sourceUrls ? <div>{draft.sourceUrls.length} source URLs</div> : null}
                      {draft.pros || draft.cons ? <div>{draft.pros?.length ?? 0} pros | {draft.cons?.length ?? 0} cons</div> : null}
                      <div>{draft.keywordClusterId ?? "No cluster"} | {draft.keywordIntent ?? "no intent"}</div>
                      <div>{draft.angleType ?? "no angle"} angle</div>
                      <div>{draft.difficulty} | {draft.estimatedCompletionTime}</div>
                      <div>{draft.maxRewardAmount ? `$${draft.maxRewardAmount.toFixed(2)}` : "No payout"}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setExpanded((current) => ({ ...current, [draft.previewId]: !isExpanded }))} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                      {isExpanded ? "Collapse preview" : "Expand preview"}
                    </button>
                    {hasDuplicateKeyword ? <span className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">Duplicate keyword target</span> : null}
                    {draft.quality.requiredErrors.length > 0 ? <span className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{draft.quality.requiredErrors.length} publish blockers</span> : null}
                    {draft.needsVariation ? <span className="rounded-lg bg-orange-100 px-3 py-2 text-xs font-bold text-orange-800">Needs variation</span> : null}
                    {draft.cannibalizationIssues?.some((issue) => issue.severity === "block") ? <span className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-800">Duplicate keyword blocker</span> : null}
                    {draft.cannibalizationIssues?.some((issue) => issue.severity === "warning") ? <span className="rounded-lg bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-800">Cluster overlap warning</span> : null}
                  </div>

                  {draft.cannibalizationIssues && draft.cannibalizationIssues.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <div className="font-extrabold">Cannibalization warnings</div>
                      <ul className="mt-1 list-disc pl-4">
                        {draft.cannibalizationIssues.map((issue, index) => (
                          <li key={`${issue.type}-${index}`}>{issue.message} Suggestion: merge guides, change the keyword, or convert one into a subsection.</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {draft.researchSummary || (draft.claimsNeedingVerification && draft.claimsNeedingVerification.length > 0) ? (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-950">
                      <div className="font-extrabold">Research preview</div>
                      {draft.researchSummary ? <p className="mt-1 leading-relaxed">{draft.researchSummary}</p> : null}
                      {draft.claimsNeedingVerification && draft.claimsNeedingVerification.length > 0 ? (
                        <ul className="mt-2 list-disc pl-4">
                          {draft.claimsNeedingVerification.slice(0, 5).map((claim, index) => (
                            <li key={`${draft.previewId}-claim-${index}`}>{claim}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  {isExpanded ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="prose prose-slate max-w-none prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100 prose-img:max-w-full prose-img:rounded-xl" dangerouslySetInnerHTML={{ __html: draft.bodyHtml }} />
                    </div>
                  ) : null}
                </article>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {savedGuides.length > 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Saved draft guides</h2>
              <p className="mt-1 text-sm text-gray-500">{savedGuides.length} selected drafts were saved.</p>
            </div>
            {savedGuides[0]?.guide_type ? null : null}
            <Link href={`/app/admin/guides/batches/${encodeURIComponent(batchName || "Guide batch")}`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
              Review Batch
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Keyword</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {savedGuides.map((guide) => (
                  <tr key={guide.id}>
                    <td className="px-4 py-3"><div className="font-bold text-gray-900">{guide.title}</div><div className="font-mono text-xs text-gray-400">{guide.slug}</div></td>
                    <td className="px-4 py-3 text-gray-600">{guide.keyword_target ?? "Not set"}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{guide.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/app/admin/guides/${guide.id}/edit`} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-800">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
