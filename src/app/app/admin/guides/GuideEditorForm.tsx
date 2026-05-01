"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "@/app/guides/[slug]/markdownRenderer";
import GameCombobox, { type GameOption } from "./GameCombobox";
import RichTextEditor from "@/components/editor/RichTextEditor";

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white transition";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5";
const hintClass = "text-xs text-gray-400 mt-1";

type GuideFocus = "fastest completion" | "highest payout" | "beginner friendly" | "no-spend" | "platform comparison";
type GuideTemplate = "milestone guide" | "speed guide" | "comparison guide" | "beginner guide";
type RegeneratableSection = "intro" | "overview" | "step_by_step" | "faq" | "seo";

type SeedOfferTask = {
    id: string;
    sort_order: number;
    title: string;
    reward_amount: number;
    reward_display: string | null;
    task_type: string;
    time_limit_text: string | null;
};

type SeedOffer = {
    id: string;
    provider_name: string;
    platform_name: string;
    payout_usd: number;
    total_payout_usd: number;
    milestone_count: number;
    goal_text: string | null;
    tasks: SeedOfferTask[];
};

type InternalLinkSuggestion = {
    label: string;
    href: string;
    reason: string;
};

type GuideOfferOption = {
    id: string;
    title: string;
    platform: string | null;
    provider: string | null;
    payout: number | null;
    matchReason?: string;
    score?: number;
};

type SeedResponse = {
    autofill?: {
        title?: string;
        slug?: string;
        excerpt?: string;
        max_payout_usd?: number;
        estimated_time?: string;
        difficulty?: string;
        checklist_items?: string[];
        key_takeaways?: string[];
        seo_title?: string;
        seo_description?: string;
    };
    draft?: {
        body_md?: string;
        tips?: string[];
    };
    sections?: Record<string, string>;
    top_offers?: SeedOffer[];
    internal_links?: InternalLinkSuggestion[];
};

type GuideRecord = {
    id: string;
    title: string;
    slug: string;
    game_id: string;
    excerpt: string | null;
    body_md: string | null;
    difficulty: string | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    tips: string[] | null;
    key_takeaways: string | null;
    checklist_items: string[] | null;
    video_url: string | null;
    layout_style: string;
    show_related_offers: boolean;
    show_related_guides: boolean;
    primary_offer_id?: string | null;
    disable_auto_offer_matching?: boolean | null;
    seo_title: string | null;
    seo_description: string | null;
    status: string;
};

type SourceGuide = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body_md: string | null;
    difficulty: string | null;
    estimated_time: string | null;
    max_payout_usd: number | null;
    tips: string[] | null;
    key_takeaways: string | null;
    checklist_items: string[] | null;
    video_url: string | null;
    layout_style: string | null;
    show_related_offers: boolean | null;
    show_related_guides: boolean | null;
    seo_title: string | null;
    seo_description: string | null;
};

function slugify(str: string) {
    return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
    return (
        <button
            type="button"
            id={id}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`} />
        </button>
    );
}

function buildSeoTitle(title: string, maxPayout: string) {
    if (!title.trim()) return "";
    const payoutNumber = Number(maxPayout);
    const amount = Number.isFinite(payoutNumber) && maxPayout ? ` - Earn Up To $${payoutNumber.toFixed(2)}` : "";
    return `${title}${amount}`;
}

function buildSeoDescription(excerpt: string, estimatedTime: string, focus: GuideFocus) {
    const summary = excerpt.trim() || "Guide with payout breakdown, milestones, and provider notes.";
    const suffix = [focus, estimatedTime].filter(Boolean).join(" | ");
    return suffix ? `${summary} ${suffix}` : summary;
}

function buildOfferSeedBody(gameName: string, offer: SeedOffer, focus: GuideFocus) {
    const steps = offer.tasks.length > 0
        ? offer.tasks.map((task, index) => `${index + 1}. ${task.title}`).join("\n")
        : "1. Complete the first tracked milestone.\n2. Verify crediting after each checkpoint.\n3. Review later milestones before committing more time.";

    return [
        "## Intro",
        `${gameName} has an active route on ${offer.provider_name} via ${offer.platform_name}. This draft is seeded from the tracked milestone ladder and optimized for ${focus}.`,
        "",
        "## Overview",
        `This route currently pays up to $${offer.total_payout_usd.toFixed(2)} across ${offer.milestone_count} milestones.`,
        "",
        "## Step-by-Step Section",
        steps,
        "",
        "## Platform Notes",
        `- Provider: ${offer.provider_name}`,
        `- Platform: ${offer.platform_name}`,
        `- Total payout: $${offer.total_payout_usd.toFixed(2)}`,
        `- Milestones: ${offer.milestone_count}`,
        "",
        "## Expert Tips",
        "- Track each milestone manually.",
        "- Keep screenshots for higher-value checkpoints.",
        "- Stop and confirm crediting before pushing into the longest milestones.",
        "",
        "## FAQ",
        "### Is this the best route?",
        "Compare this seeded offer against the other provider rows in the form before publishing.",
    ].join("\n");
}

function stripHtmlTags(value: string) {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function replaceSection(body: string, nextSectionBlock: string, headings: string[]) {
    const normalizedBody = body.trim();
    const normalizedHeadings = headings.map((heading) => heading.toLowerCase().trim());

    if (!normalizedBody) return nextSectionBlock.trim();

    const parser = new DOMParser();
    const currentDoc = parser.parseFromString(`<div>${normalizedBody}</div>`, "text/html");
    const nextDoc = parser.parseFromString(`<div>${nextSectionBlock.trim()}</div>`, "text/html");
    const container = currentDoc.body.firstElementChild as HTMLElement | null;
    const nextContainer = nextDoc.body.firstElementChild as HTMLElement | null;

    if (!container || !nextContainer) return `${normalizedBody}\n${nextSectionBlock.trim()}`;

    const children = Array.from(container.children);
    let startIndex = -1;
    let endIndex = children.length;

    for (let i = 0; i < children.length; i++) {
        const element = children[i];
        if (element.tagName.toLowerCase() !== "h2") continue;
        const headingText = stripHtmlTags(element.innerHTML).toLowerCase();
        if (!normalizedHeadings.includes(headingText)) continue;
        startIndex = i;
        for (let j = i + 1; j < children.length; j++) {
            if (children[j].tagName.toLowerCase() === "h2") {
                endIndex = j;
                break;
            }
        }
        break;
    }

    if (startIndex >= 0) {
        children.slice(startIndex, endIndex).forEach((node) => node.remove());
    }

    Array.from(nextContainer.children).forEach((node) => {
        container.appendChild(currentDoc.importNode(node, true));
    });

    return container.innerHTML.trim();
}

function buildMarkdownLinkBlock(links: InternalLinkSuggestion[]) {
    const unique = links.filter((link, index) => links.findIndex((item) => item.href === link.href) === index);
    return unique.map((link) => `- [${link.label}](${link.href})`).join("\n");
}

function buildValidationWarnings(args: {
    excerpt: string;
    bodyMd: string;
    checklistItems: string;
    seoTitle: string;
    seoDescription: string;
    internalLinks: InternalLinkSuggestion[];
    duplicateSlug: boolean;
}) {
    const warnings: string[] = [];
    if (!args.excerpt.trim()) warnings.push("Missing excerpt.");
    if (stripHtmlTags(args.bodyMd).length < 700) warnings.push("Body is short. Aim for a fuller walkthrough before publishing.");
    if (!/(<h2[^>]*>\s*faq\s*<\/h2>)|(<h3[^>]*>)/i.test(args.bodyMd)) warnings.push("FAQ-like content is missing.");
    if (!args.checklistItems.trim()) warnings.push("Checklist items are missing.");
    if (!args.seoTitle.trim()) warnings.push("SEO title is missing.");
    if (!args.seoDescription.trim()) warnings.push("SEO description is missing.");
    if (args.duplicateSlug) warnings.push("Slug already exists on another guide.");
    const hasInternalLink = args.internalLinks.some((link) => args.bodyMd.includes(link.href));
    if (!hasInternalLink) warnings.push("Body is missing internal links from the current suggestions.");
    return warnings;
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Request failed.");
    }
    return res.json();
}

export default function GuideEditorForm({
    mode,
    guide,
    initialGame,
    sourceGuide,
    availableOffers = [],
    matchedOffers = [],
}: {
    mode: "create" | "edit";
    guide?: GuideRecord | null;
    initialGame?: GameOption | null;
    sourceGuide?: SourceGuide | null;
    availableOffers?: GuideOfferOption[];
    matchedOffers?: GuideOfferOption[];
}) {
    const router = useRouter();
    const [title, setTitle] = useState(guide?.title ?? sourceGuide?.title ?? "");
    const [slug, setSlug] = useState(guide?.slug ?? "");
    const [slugManual, setSlugManual] = useState(mode === "edit");
    const [gameId, setGameId] = useState(guide?.game_id ?? "");
    const [selectedGame, setSelectedGame] = useState<GameOption | null>(initialGame ?? null);
    const [guideFocus, setGuideFocus] = useState<GuideFocus>("highest payout");
    const [guideTemplate, setGuideTemplate] = useState<GuideTemplate>("milestone guide");
    const [excerpt, setExcerpt] = useState(guide?.excerpt ?? sourceGuide?.excerpt ?? "");
    const [bodyMd, setBodyMd] = useState(() => renderMarkdown(guide?.body_md ?? sourceGuide?.body_md ?? ""));
    const [difficulty, setDifficulty] = useState(guide?.difficulty ?? sourceGuide?.difficulty ?? "");
    const [estimatedTime, setEstimatedTime] = useState(guide?.estimated_time ?? sourceGuide?.estimated_time ?? "");
    const [maxPayout, setMaxPayout] = useState(guide?.max_payout_usd?.toString() ?? sourceGuide?.max_payout_usd?.toString() ?? "");
    const [tips, setTips] = useState((guide?.tips ?? sourceGuide?.tips ?? []).join("\n"));
    const [keyTakeaways, setKeyTakeaways] = useState(guide?.key_takeaways ?? sourceGuide?.key_takeaways ?? "");
    const [checklistItems, setChecklistItems] = useState((guide?.checklist_items ?? sourceGuide?.checklist_items ?? []).join("\n"));
    const [videoUrl, setVideoUrl] = useState(guide?.video_url ?? sourceGuide?.video_url ?? "");
    const [layoutStyle, setLayoutStyle] = useState(guide?.layout_style ?? sourceGuide?.layout_style ?? "classic");
    const [showOffers, setShowOffers] = useState(guide?.show_related_offers ?? sourceGuide?.show_related_offers ?? true);
    const [showGuides, setShowGuides] = useState(guide?.show_related_guides ?? sourceGuide?.show_related_guides ?? true);
    const [primaryOfferId, setPrimaryOfferId] = useState(guide?.primary_offer_id ?? "");
    const [disableAutoOfferMatching, setDisableAutoOfferMatching] = useState(Boolean(guide?.disable_auto_offer_matching));
    const [seoTitle, setSeoTitle] = useState(guide?.seo_title ?? sourceGuide?.seo_title ?? "");
    const [seoDesc, setSeoDesc] = useState(guide?.seo_description ?? sourceGuide?.seo_description ?? "");
    const [status, setStatus] = useState(guide?.status ?? "draft");
    const [topOffers, setTopOffers] = useState<SeedOffer[]>([]);
    const [internalLinks, setInternalLinks] = useState<InternalLinkSuggestion[]>([]);
    const [lastSeed, setLastSeed] = useState<SeedResponse | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingSeed, setLoadingSeed] = useState(false);
    const [regeneratingSection, setRegeneratingSection] = useState<RegeneratableSection | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [duplicateSlug, setDuplicateSlug] = useState(false);
    const [slugChecking, setSlugChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const renderedPreview = useMemo(() => renderMarkdown(bodyMd), [bodyMd]);
    const effectiveSeoTitle = seoTitle.trim() || buildSeoTitle(title, maxPayout);
    const effectiveSeoDescription = seoDesc.trim() || buildSeoDescription(excerpt, estimatedTime, guideFocus);
    const validationWarnings = useMemo(
        () => buildValidationWarnings({
            excerpt,
            bodyMd,
            checklistItems,
            seoTitle: effectiveSeoTitle,
            seoDescription: effectiveSeoDescription,
            internalLinks,
            duplicateSlug,
        }),
        [excerpt, bodyMd, checklistItems, effectiveSeoTitle, effectiveSeoDescription, internalLinks, duplicateSlug],
    );

    const layoutHints: Record<string, string> = {
        classic: "Clean single-column editorial article. Best for SEO.",
        steps: "Numbered step cards based on ## headings. Best for walkthroughs.",
        pro: "Most polished layout with checklist and key takeaways.",
    };

    useEffect(() => {
        const normalizedSlug = slug.trim();
        if (!normalizedSlug) {
            setDuplicateSlug(false);
            return;
        }
        const timeout = window.setTimeout(async () => {
            try {
                setSlugChecking(true);
                const query = `/api/admin/guides/validate?slug=${encodeURIComponent(normalizedSlug)}${guide?.id ? `&excludeId=${encodeURIComponent(guide.id)}` : ""}`;
                const result = await fetchJson<{ duplicateSlug: boolean }>(query);
                setDuplicateSlug(Boolean(result.duplicateSlug));
            } catch {
                setDuplicateSlug(false);
            } finally {
                setSlugChecking(false);
            }
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [slug, guide?.id]);

    async function getSeed(game: GameOption) {
        const params = new URLSearchParams({
            game_id: game.id,
            focus: guideFocus,
            template: guideTemplate,
        });
        if (sourceGuide?.id) params.set("source_guide_id", sourceGuide.id);
        return fetchJson<SeedResponse>(`/api/admin/guides/seed?${params.toString()}`);
    }

    async function loadSeed(game: GameOption, options?: { overwriteDraft?: boolean; preserveSeo?: boolean }) {
        setLoadingSeed(true);
        setError(null);
        try {
            const json = await getSeed(game);
            const autofill = json.autofill ?? {};
            setLastSeed(json);
            setTopOffers(Array.isArray(json.top_offers) ? json.top_offers : []);
            setInternalLinks(Array.isArray(json.internal_links) ? json.internal_links : []);

            setTitle(autofill.title ?? game.name);
            if (!slugManual || mode === "create") {
                setSlug(slugify(autofill.slug ?? autofill.title ?? game.name));
                setSlugManual(false);
            }
            setExcerpt(autofill.excerpt ?? "");
            setMaxPayout(autofill.max_payout_usd ? String(autofill.max_payout_usd) : "");
            setEstimatedTime(autofill.estimated_time ?? "");
            setDifficulty(autofill.difficulty ?? "");
            setChecklistItems(Array.isArray(autofill.checklist_items) ? autofill.checklist_items.join("\n") : "");
            setKeyTakeaways(Array.isArray(autofill.key_takeaways) ? autofill.key_takeaways.join("\n") : "");

            if (!options?.preserveSeo || !seoTitle.trim()) setSeoTitle(autofill.seo_title ?? "");
            if (!options?.preserveSeo || !seoDesc.trim()) setSeoDesc(autofill.seo_description ?? "");
            if (options?.overwriteDraft) {
                setBodyMd(renderMarkdown(json.draft?.body_md ?? ""));
                setTips(Array.isArray(json.draft?.tips) ? json.draft.tips.join("\n") : "");
            }
        } catch (seedError) {
            setError(seedError instanceof Error ? seedError.message : "Failed to generate guide seed.");
        } finally {
            setLoadingSeed(false);
        }
    }

    async function handleGenerateDraft() {
        if (!selectedGame) {
            setError("Select a game first.");
            return;
        }
        await loadSeed(selectedGame, { overwriteDraft: true });
    }

    async function handleRegenerateSection(section: RegeneratableSection) {
        if (!selectedGame) {
            setError("Select a game first.");
            return;
        }
        setRegeneratingSection(section);
        setError(null);
        try {
            const seed = lastSeed ?? await getSeed(selectedGame);
            if (!lastSeed) {
                setLastSeed(seed);
                setTopOffers(Array.isArray(seed.top_offers) ? seed.top_offers : []);
                setInternalLinks(Array.isArray(seed.internal_links) ? seed.internal_links : []);
            }
            if (section === "seo") {
                setSeoTitle(seed.autofill?.seo_title ?? "");
                setSeoDesc(seed.autofill?.seo_description ?? "");
                return;
            }

            const nextBlock = seed.sections?.[section];
            if (!nextBlock) return;

            const headingMap: Record<Exclude<RegeneratableSection, "seo">, string[]> = {
                intro: ["Intro"],
                overview: ["Overview"],
                step_by_step: ["Step-by-Step Section", "Fastest Route", "Beginner Walkthrough"],
                faq: ["FAQ"],
            };
            setBodyMd((current) => replaceSection(current, renderMarkdown(nextBlock), headingMap[section]));
        } catch (sectionError) {
            setError(sectionError instanceof Error ? sectionError.message : "Failed to regenerate section.");
        } finally {
            setRegeneratingSection(null);
        }
    }

    function handleTitleChange(value: string) {
        setTitle(value);
        if (!slugManual) setSlug(slugify(value));
    }

    function applyOfferMilestones(offer: SeedOffer) {
        setChecklistItems(offer.tasks.map((task) => task.title).join("\n"));
        setKeyTakeaways([
            `Use ${offer.provider_name} on ${offer.platform_name} for the current ${guideFocus} route.`,
            `This route pays up to $${offer.total_payout_usd.toFixed(2)} across ${offer.milestone_count} milestones.`,
            ...offer.tasks.slice(0, 3).map((task) => `Prioritize milestone: ${task.title}`),
        ].join("\n"));
        setBodyMd(renderMarkdown(buildOfferSeedBody(selectedGame?.name ?? "This game", offer, guideFocus)));
    }

    function addInternalLinksToBody() {
        if (internalLinks.length === 0) return;
        const block = `## Related Links\n${buildMarkdownLinkBlock(internalLinks)}`;
        setBodyMd((current) => replaceSection(current, renderMarkdown(block), ["Related Links"]));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!title.trim() || !slug.trim() || !gameId) {
            setError("Title, slug, and game are required.");
            return;
        }

        setSaving(true);
        const finalSeoTitle = seoTitle.trim() || buildSeoTitle(title, maxPayout);
        const finalSeoDescription = seoDesc.trim() || buildSeoDescription(excerpt, estimatedTime, guideFocus);
        const payload = {
            title,
            slug,
            game_id: gameId,
            excerpt: excerpt || null,
            body_md: bodyMd || null,
            difficulty: difficulty || null,
            estimated_time: estimatedTime || null,
            max_payout_usd: maxPayout || null,
            tips: tips || null,
            key_takeaways: keyTakeaways || null,
            checklist_items: checklistItems || null,
            video_url: videoUrl || null,
            layout_style: layoutStyle,
            show_related_offers: showOffers,
            show_related_guides: showGuides,
            primary_offer_id: primaryOfferId || null,
            disable_auto_offer_matching: disableAutoOfferMatching,
            seo_title: finalSeoTitle || null,
            seo_description: finalSeoDescription || null,
            guide_focus: guideFocus,
            guide_template: guideTemplate,
            status,
        };

        const endpoint = mode === "create" ? "/api/admin/guides" : `/api/admin/guides/${guide?.id}`;
        const method = mode === "create" ? "POST" : "PATCH";
        const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Save failed. Please try again.");
            setSaving(false);
            return;
        }

        router.push("/app/admin/guides");
        router.refresh();
    }

    async function handleDelete() {
        if (!guide?.id) return;
        if (!confirm("Delete this guide permanently? This cannot be undone.")) return;
        setDeleting(true);
        const res = await fetch(`/api/admin/guides/${guide.id}`, { method: "DELETE" });
        if (!res.ok) {
            setError("Delete failed.");
            setDeleting(false);
            return;
        }
        router.push("/app/admin/guides");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {sourceGuide && mode === "create" ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm">
                    Creating a similar guide from <span className="font-semibold">{sourceGuide.title}</span>. Pick a game, then reseed the draft and sections.
                </div>
            ) : null}

            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
            ) : null}

            {(status === "published" || validationWarnings.length > 0) ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="text-sm font-semibold text-amber-900">Pre-publish validation</div>
                    {validationWarnings.length === 0 ? (
                        <div className="text-sm text-green-700">No publish warnings.</div>
                    ) : (
                        <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                            {validationWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                        </ul>
                    )}
                </div>
            ) : null}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Basic Info</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <GameCombobox
                            value={gameId}
                            onChange={async (nextGameId, option) => {
                                setGameId(nextGameId);
                                setSelectedGame(option);
                                if (option) {
                                    await loadSeed(option, { overwriteDraft: false, preserveSeo: true });
                                } else {
                                    setTopOffers([]);
                                    setInternalLinks([]);
                                }
                            }}
                            labelClassName={labelClass}
                            inputClassName={inputClass}
                            hintClassName={hintClass}
                            required
                            initialOption={initialGame ?? undefined}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Guide Focus</label>
                        <select value={guideFocus} onChange={(e) => setGuideFocus(e.target.value as GuideFocus)} className={inputClass}>
                            <option value="fastest completion">fastest completion</option>
                            <option value="highest payout">highest payout</option>
                            <option value="beginner friendly">beginner friendly</option>
                            <option value="no-spend">no-spend</option>
                            <option value="platform comparison">platform comparison</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Guide Template</label>
                        <select value={guideTemplate} onChange={(e) => setGuideTemplate(e.target.value as GuideTemplate)} className={inputClass}>
                            <option value="milestone guide">milestone guide</option>
                            <option value="speed guide">speed guide</option>
                            <option value="comparison guide">comparison guide</option>
                            <option value="beginner guide">beginner guide</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleGenerateDraft}
                        disabled={!selectedGame || loadingSeed}
                        className="px-4 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loadingSeed ? "Generating..." : "Generate Draft"}
                    </button>
                    <span className={hintClass}>Pulls game, payout, milestone, and link data into a draft guide.</span>
                </div>

                <div>
                    <label className={labelClass}>Title *</label>
                    <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} required className={inputClass} />
                </div>

                <div>
                    <label className={labelClass}>Slug *</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setSlugManual(true);
                            }}
                            required
                            className={`${inputClass} font-mono`}
                        />
                        {slugManual ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setSlug(slugify(title));
                                    setSlugManual(false);
                                }}
                                className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-700 underline whitespace-nowrap"
                            >
                                Auto
                            </button>
                        ) : null}
                    </div>
                    <p className={hintClass}>
                        URL: /guides/{slug || "..."} {slugChecking ? "- checking..." : duplicateSlug ? "- duplicate slug" : ""}
                    </p>
                </div>

                <div>
                    <label className={labelClass}>Excerpt</label>
                    <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Offer Data</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Difficulty</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                            <option value="">- Select -</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Estimated Completion Time</label>
                        <input type="text" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Max Payout (USD)</label>
                        <input type="number" step="0.01" value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Video URL</label>
                    <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputClass} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Related Offers</h2>
                    {internalLinks.length > 0 ? (
                        <button
                            type="button"
                            onClick={addInternalLinksToBody}
                            className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Add links to body
                        </button>
                    ) : null}
                </div>
                {topOffers.length === 0 ? (
                    <p className={hintClass}>Select a game to load provider payouts and milestone ladders.</p>
                ) : (
                    <div className="space-y-3">
                        {topOffers.map((offer) => (
                            <div key={offer.id} className="rounded-xl border border-gray-200 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">{offer.provider_name} on {offer.platform_name}</div>
                                        <div className="text-xs text-gray-500">
                                            ${offer.total_payout_usd.toFixed(2)} total payout - {offer.milestone_count} milestones
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => applyOfferMilestones(offer)}
                                        className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        Use this offer seed
                                    </button>
                                </div>
                                {offer.tasks.length > 0 ? (
                                    <ol className="mt-3 list-decimal pl-5 text-xs text-gray-600 space-y-1">
                                        {offer.tasks.slice(0, 5).map((task) => (
                                            <li key={task.id}>{task.title}</li>
                                        ))}
                                    </ol>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Internal Link Suggestions</h2>
                {internalLinks.length === 0 ? (
                    <p className={hintClass}>Link suggestions load after you select a game.</p>
                ) : (
                    <div className="space-y-2">
                        {internalLinks.map((link) => (
                            <div key={link.href} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-semibold text-gray-800">{link.label}</div>
                                    <div className="text-xs text-gray-500 font-mono">{link.href}</div>
                                    <div className="text-xs text-gray-400">{link.reason}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Layout & Display</h2>

                <div>
                    <label className={labelClass}>Layout Style</label>
                    <select value={layoutStyle} onChange={(e) => setLayoutStyle(e.target.value)} className={inputClass}>
                        <option value="classic">Classic - Editorial article</option>
                        <option value="steps">Steps - Numbered walkthrough</option>
                        <option value="pro">Pro - Premium conversion layout</option>
                    </select>
                    <p className={hintClass}>{layoutHints[layoutStyle]}</p>
                </div>

                <div className="flex items-center justify-between py-2">
                    <div>
                        <div className="text-sm font-semibold text-gray-700">Show Related Offers</div>
                        <div className="text-xs text-gray-400 mt-0.5">Display top offers for this game in the sidebar</div>
                    </div>
                    <Toggle id="showOffers" checked={showOffers} onChange={setShowOffers} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div>
                        <div className="text-sm font-semibold text-gray-700">Show Related Guides</div>
                        <div className="text-xs text-gray-400 mt-0.5">Display other guides for this game in the sidebar</div>
                    </div>
                    <Toggle id="showGuides" checked={showGuides} onChange={setShowGuides} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Guide Offer Matching</h2>
                <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                    <div>
                        <label className={labelClass}>Manual Primary Offer</label>
                        <select value={primaryOfferId} onChange={(e) => setPrimaryOfferId(e.target.value)} className={inputClass}>
                            <option value="">Use auto-matched highest scoring offer</option>
                            {availableOffers.map((offer) => (
                                <option key={offer.id} value={offer.id}>
                                    {offer.title} {offer.platform ? `- ${offer.platform}` : ""} {typeof offer.payout === "number" ? `- $${offer.payout.toFixed(2)}` : ""}
                                </option>
                            ))}
                        </select>
                        <p className={hintClass}>Manual primary offers are shown first, with auto-matched alternatives below them.</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                        <div>
                            <div className="text-sm font-semibold text-gray-700">Disable Auto Matching</div>
                            <div className="text-xs text-gray-400 mt-0.5">Use fallback CTA unless a manual primary offer is selected.</div>
                        </div>
                        <Toggle id="disableAutoOfferMatching" checked={disableAutoOfferMatching} onChange={setDisableAutoOfferMatching} />
                    </div>
                </div>
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Current auto matches</div>
                    {matchedOffers.length > 0 ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {matchedOffers.slice(0, 4).map((offer) => (
                                <div key={offer.id} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                                    <div className="font-bold text-gray-900">{offer.title}</div>
                                    <div className="mt-0.5 text-xs text-gray-500">
                                        {offer.platform ?? "Unknown platform"} {typeof offer.payout === "number" ? `- $${offer.payout.toFixed(2)}` : ""}
                                    </div>
                                    <div className="mt-1 text-[11px] font-semibold text-lime-700">
                                        {offer.matchReason ?? "Matched offer"} {typeof offer.score === "number" ? `- score ${offer.score}` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={hintClass}>No auto-matched offers found. Public guide CTAs will fall back to the offers page.</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Content (Rich Text)</h2>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleRegenerateSection("intro")} disabled={!selectedGame || regeneratingSection !== null} className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                            {regeneratingSection === "intro" ? "Regenerating..." : "Regenerate intro"}
                        </button>
                        <button type="button" onClick={() => handleRegenerateSection("overview")} disabled={!selectedGame || regeneratingSection !== null} className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                            {regeneratingSection === "overview" ? "Regenerating..." : "Regenerate overview"}
                        </button>
                        <button type="button" onClick={() => handleRegenerateSection("step_by_step")} disabled={!selectedGame || regeneratingSection !== null} className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                            {regeneratingSection === "step_by_step" ? "Regenerating..." : "Regenerate step-by-step"}
                        </button>
                        <button type="button" onClick={() => handleRegenerateSection("faq")} disabled={!selectedGame || regeneratingSection !== null} className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                            {regeneratingSection === "faq" ? "Regenerating..." : "Regenerate FAQ"}
                        </button>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Body</label>
                    <RichTextEditor value={bodyMd} onChange={setBodyMd} />
                </div>

                <div>
                    <label className={labelClass}>Tips (one per line)</label>
                    <textarea value={tips} onChange={(e) => setTips(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
                </div>

                <div>
                    <label className={labelClass}>Key Takeaways</label>
                    <textarea value={keyTakeaways} onChange={(e) => setKeyTakeaways(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
                </div>

                <div>
                    <label className={labelClass}>Checklist Items</label>
                    <textarea value={checklistItems} onChange={(e) => setChecklistItems(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO</h2>
                    <button type="button" onClick={() => handleRegenerateSection("seo")} disabled={!selectedGame || regeneratingSection !== null} className="px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        {regeneratingSection === "seo" ? "Regenerating..." : "Regenerate SEO title/description"}
                    </button>
                </div>
                <div>
                    <label className={labelClass}>SEO Title</label>
                    <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Auto-generated if left blank" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>SEO Description</label>
                    <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} placeholder="Auto-generated if left blank" className={`${inputClass} resize-none`} />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Rendered Guide Preview</h2>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div
                            className="prose prose-slate max-w-none text-sm prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-td:border prose-th:bg-gray-100"
                            dangerouslySetInnerHTML={{ __html: renderedPreview }}
                        />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Meta Preview</h2>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs text-green-700">https://earngrind.com/guides/{slug || "game-guide"}</div>
                        <div className="mt-1 text-lg text-blue-700">{effectiveSeoTitle || "SEO title preview"}</div>
                        <p className="mt-1 text-sm text-gray-600">{effectiveSeoDescription || "SEO description preview"}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
                {mode === "edit" ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || saving}
                        className="px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded-xl bg-white hover:bg-red-50 transition disabled:opacity-40"
                    >
                        {deleting ? "Deleting..." : "Delete Guide"}
                    </button>
                ) : (
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition">
                        Cancel
                    </button>
                )}
                <div className="flex items-center gap-3">
                    {mode === "edit" ? (
                        <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition">
                            Cancel
                        </button>
                    ) : null}
                    <button type="submit" disabled={saving || deleting} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-extrabold rounded-xl hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                        {saving ? "Saving..." : mode === "create" ? "Create Guide" : "Save Changes"}
                    </button>
                </div>
            </div>
        </form>
    );
}

