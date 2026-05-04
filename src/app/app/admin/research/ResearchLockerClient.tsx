"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ResearchEntry = {
  id: string;
  type: "platform" | "game" | "offer" | "general";
  target_name: string;
  source_type: "url" | "reddit" | "trustpilot" | "note" | "screenshot";
  source_url: string | null;
  image_url: string | null;
  raw_text: string;
  extracted_data: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type IngestResult = {
  entry: ResearchEntry;
  extractedTextPreview: string;
  extractedData: {
    payoutMentions?: string[];
    complaints?: string[];
    trustSignals?: string[];
    requirements?: string[];
    risks?: string[];
    paymentMethods?: string[];
  };
  confidenceScore: number;
  warnings?: string[];
  updatedExisting?: boolean;
};

const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500";

function emptyForm() {
  return {
    id: "",
    targetName: "",
    type: "platform",
    sourceType: "note",
    sourceUrl: "",
    imageUrl: "",
    rawText: "",
    tags: "",
  };
}

function tagText(tags: string[]) {
  return tags.length ? tags.join(", ") : "";
}

function emptyUrlImportForm() {
  return {
    targetName: "",
    type: "platform",
    sourceType: "auto",
    sourceUrl: "",
    tags: "",
    updateExisting: false,
  };
}

function valueList(values: string[] | undefined) {
  return values && values.length ? values.join(", ") : "None detected";
}

function countExtractedItems(entry: ResearchEntry) {
  const data = entry.extracted_data ?? {};
  return Object.values(data).reduce<number>((sum, value) => {
    if (Array.isArray(value)) return sum + value.length;
    return sum;
  }, 0);
}

function extractedCount(entry: ResearchEntry, key: string) {
  const value = entry.extracted_data?.[key];
  return Array.isArray(value) ? value.length : 0;
}

function sourceLabel(value: string) {
  if (value === "trustpilot") return "Trustpilot";
  if (value === "reddit") return "Reddit";
  if (value === "screenshot") return "Screenshot";
  if (value === "url") return "URL";
  return "Manual note";
}

function typeLabel(value: string) {
  if (value === "platform") return "Platform";
  if (value === "game") return "Game";
  if (value === "offer") return "Offer";
  return "General";
}

function daysSince(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function WorkflowStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-950 text-xs font-extrabold text-white">{step}</div>
      <h3 className="mt-3 text-sm font-extrabold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
    </div>
  );
}

export default function ResearchLockerClient({ initialEntries }: { initialEntries: ResearchEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [form, setForm] = useState(emptyForm());
  const [targetFilter, setTargetFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlImportForm, setUrlImportForm] = useState(emptyUrlImportForm());
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [duplicateEntry, setDuplicateEntry] = useState<ResearchEntry | null>(null);

  const rows = useMemo(() => entries.filter((entry) => {
    if (targetFilter && !entry.target_name.toLowerCase().includes(targetFilter.toLowerCase())) return false;
    if (typeFilter && entry.type !== typeFilter) return false;
    if (sourceTypeFilter && entry.source_type !== sourceTypeFilter) return false;
    return true;
  }), [entries, targetFilter, typeFilter, sourceTypeFilter]);

  const summary = useMemo(() => {
    const withSourceUrl = entries.filter((entry) => entry.source_url).length;
    const withExtractedEvidence = entries.filter((entry) => countExtractedItems(entry) > 0).length;
    const recentEntries = entries.filter((entry) => {
      const timestamp = new Date(entry.updated_at).getTime();
      return Number.isFinite(timestamp) && Date.now() - timestamp <= 14 * 86_400_000;
    }).length;
    return {
      total: entries.length,
      platforms: entries.filter((entry) => entry.type === "platform").length,
      games: entries.filter((entry) => entry.type === "game").length,
      sourceCoverage: entries.length ? Math.round((withSourceUrl / entries.length) * 100) : 0,
      evidenceCoverage: entries.length ? Math.round((withExtractedEvidence / entries.length) * 100) : 0,
      recentEntries,
    };
  }, [entries]);

  async function saveEntry() {
    if (!form.targetName.trim()) {
      setError("Target name is required.");
      return;
    }
    if (!form.rawText.trim() && !form.imageUrl.trim()) {
      setError("Paste research notes or add a screenshot image URL.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const endpoint = form.id ? `/api/admin/research/${form.id}` : "/api/admin/research";
      const response = await fetch(endpoint, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Save failed.");
      const entry = json.entry as ResearchEntry;
      setEntries((current) => form.id ? current.map((item) => item.id === entry.id ? entry : item) : [entry, ...current]);
      setForm(emptyForm());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function ingestUrl() {
    if (!urlImportForm.targetName.trim()) {
      setError("Target name is required before importing a URL.");
      return;
    }
    if (!urlImportForm.sourceUrl.trim()) {
      setError("Source URL is required.");
      return;
    }
    setIngesting(true);
    setError(null);
    setDuplicateEntry(null);
    setIngestResult(null);
    try {
      const response = await fetch("/api/admin/research/ingest-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(urlImportForm),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.duplicate && json.entry) setDuplicateEntry(json.entry);
        throw new Error(json.error ?? "URL ingestion failed.");
      }
      const result = json as IngestResult;
      setIngestResult(result);
      setEntries((current) => {
        const exists = current.some((entry) => entry.id === result.entry.id);
        return exists ? current.map((entry) => entry.id === result.entry.id ? result.entry : entry) : [result.entry, ...current];
      });
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "URL ingestion failed.");
    } finally {
      setIngesting(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this research entry?")) return;
    setError(null);
    const response = await fetch(`/api/admin/research/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Delete failed.");
      return;
    }
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function editEntry(entry: ResearchEntry) {
    setForm({
      id: entry.id,
      targetName: entry.target_name,
      type: entry.type,
      sourceType: entry.source_type,
      sourceUrl: entry.source_url ?? "",
      imageUrl: entry.image_url ?? "",
      rawText: entry.raw_text,
      tags: tagText(entry.tags),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Research Locker</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Research Locker</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              Store source-backed notes for platforms, games, offers, complaints, payouts, requirements, and trust signals. Use this before generating reviews or refreshing money pages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/admin/research/opportunities" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300">
              Opportunities
            </Link>
            <Link href="/app/admin/guides/batch-generate" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800">
              Generate Review
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total Research" value={summary.total} helper="Saved entries" />
        <MetricCard label="Platforms" value={summary.platforms} />
        <MetricCard label="Games" value={summary.games} />
        <MetricCard label="Source Coverage" value={`${summary.sourceCoverage}%`} helper="Has source URL" />
        <MetricCard label="Evidence Coverage" value={`${summary.evidenceCoverage}%`} helper="Has extracted signals" />
        <MetricCard label="Recent Updates" value={summary.recentEntries} helper="Last 14 days" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <WorkflowStep step="1" title="Capture Source" text="Import a URL or paste notes from Reddit, reviews, offer pages, screenshots, or payout terms." />
          <WorkflowStep step="2" title="Check Evidence" text="Look for payout mentions, requirements, trust signals, complaints, risks, and payment methods." />
          <WorkflowStep step="3" title="Use In Content" text="Open the entry and generate a review or use it to refresh guides without inventing facts." />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Import From URL</p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-900">Fetch and extract research</h2>
            <p className="mt-1 text-sm text-gray-500">
              Best for review pages, offer terms, public discussions, and competitor pages. If extraction fails, paste the text manually below.
            </p>
          </div>
          {duplicateEntry ? (
            <button type="button" onClick={() => setUrlImportForm((current) => ({ ...current, updateExisting: true }))} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Duplicate found. Enable update existing.
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Target Name</label>
            <input className={inputClass} value={urlImportForm.targetName} onChange={(event) => setUrlImportForm({ ...urlImportForm, targetName: event.target.value })} placeholder="GAIN.GG, Raid Shadow Legends" />
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input className={inputClass} value={urlImportForm.tags} onChange={(event) => setUrlImportForm({ ...urlImportForm, tags: event.target.value })} placeholder="competitor, complaints, trust" />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select className={inputClass} value={urlImportForm.type} onChange={(event) => setUrlImportForm({ ...urlImportForm, type: event.target.value })}>
              <option value="platform">Platform</option>
              <option value="game">Game</option>
              <option value="offer">Offer</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Source Type</label>
            <select className={inputClass} value={urlImportForm.sourceType} onChange={(event) => setUrlImportForm({ ...urlImportForm, sourceType: event.target.value })}>
              <option value="auto">Auto-detect</option>
              <option value="url">URL / Article</option>
              <option value="reddit">Reddit</option>
              <option value="trustpilot">Trustpilot</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Source URL</label>
            <input className={inputClass} value={urlImportForm.sourceUrl} onChange={(event) => setUrlImportForm({ ...urlImportForm, sourceUrl: event.target.value })} placeholder="https://..." />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 md:col-span-2">
            <input type="checkbox" checked={urlImportForm.updateExisting} onChange={(event) => setUrlImportForm({ ...urlImportForm, updateExisting: event.target.checked })} />
            Update existing entry if this source URL is already saved
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={ingestUrl} disabled={ingesting} className="rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-extrabold text-gray-950 hover:bg-lime-400 disabled:opacity-60">
            {ingesting ? "Fetching..." : "Fetch & Extract Research"}
          </button>
          {ingestResult ? <button type="button" onClick={() => { setUrlImportForm(emptyUrlImportForm()); setIngestResult(null); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700">Add Another Source</button> : null}
        </div>

        {ingestResult ? (
          <div className="mt-5 rounded-2xl border border-lime-200 bg-lime-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-extrabold text-gray-900">Extracted research saved</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-lime-800">Confidence {ingestResult.confidenceScore}/100</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/app/admin/research/${ingestResult.entry.id}`} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white">View Research Entry</Link>
                <Link href={`/app/admin/guides/batch-generate?mode=research_review&target=${encodeURIComponent(ingestResult.entry.target_name)}&type=${encodeURIComponent(ingestResult.entry.type)}&useStoredResearch=1`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">Generate Review From This Research</Link>
              </div>
            </div>
            {ingestResult.warnings?.length ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">{ingestResult.warnings.join(" ")}</div> : null}
            <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
              <div><span className="font-bold text-gray-900">Payout mentions:</span> {valueList(ingestResult.extractedData.payoutMentions)}</div>
              <div><span className="font-bold text-gray-900">Complaints:</span> {valueList(ingestResult.extractedData.complaints)}</div>
              <div><span className="font-bold text-gray-900">Trust signals:</span> {valueList(ingestResult.extractedData.trustSignals)}</div>
              <div><span className="font-bold text-gray-900">Requirements:</span> {valueList(ingestResult.extractedData.requirements)}</div>
              <div><span className="font-bold text-gray-900">Risks:</span> {valueList(ingestResult.extractedData.risks)}</div>
              <div><span className="font-bold text-gray-900">Payment methods:</span> {valueList(ingestResult.extractedData.paymentMethods)}</div>
            </div>
            <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-relaxed text-gray-600">{ingestResult.extractedTextPreview}</pre>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-extrabold text-gray-900">{form.id ? "Edit manual research" : "Add manual research"}</h2>
          <p className="text-sm text-gray-500">
            Use this for screenshots, copied review snippets, payout requirements, or notes that URL import cannot fetch.
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Target Name</label>
            <input className={inputClass} value={form.targetName} onChange={(event) => setForm({ ...form, targetName: event.target.value })} placeholder="Raid Shadow Legends, GAIN.GG" />
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input className={inputClass} value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="tracking, payout, complaints" />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="platform">Platform</option>
              <option value="game">Game</option>
              <option value="offer">Offer</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Source Type</label>
            <select className={inputClass} value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}>
              <option value="note">Note</option>
              <option value="url">URL</option>
              <option value="reddit">Reddit</option>
              <option value="trustpilot">Trustpilot</option>
              <option value="screenshot">Screenshot</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Source URL</label>
            <input className={inputClass} value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Screenshot Image URL</label>
            <input className={inputClass} value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Paste Content</label>
            <textarea className={`${inputClass} min-h-40 leading-relaxed`} value={form.rawText} onChange={(event) => setForm({ ...form, rawText: event.target.value })} placeholder="Paste notes, user reports, review snippets, payout details, complaints, requirements, or screenshot transcription." />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={saveEntry} disabled={saving} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60">
            {saving ? "Saving..." : form.id ? "Update Research" : "Save Research"}
          </button>
          {form.id ? <button type="button" onClick={() => setForm(emptyForm())} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700">Cancel edit</button> : null}
          {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Research library</h2>
              <p className="mt-1 text-sm text-gray-500">
                Showing {rows.length} of {entries.length} entries. Evidence counts come from the structured extractor.
              </p>
            </div>
            {(targetFilter || typeFilter || sourceTypeFilter) ? (
              <button type="button" onClick={() => { setTargetFilter(""); setTypeFilter(""); setSourceTypeFilter(""); }} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input className={inputClass} value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)} placeholder="Filter by target name" />
            <select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All types</option>
              <option value="platform">Platform</option>
              <option value="game">Game</option>
              <option value="offer">Offer</option>
              <option value="general">General</option>
            </select>
            <select className={inputClass} value={sourceTypeFilter} onChange={(event) => setSourceTypeFilter(event.target.value)}>
              <option value="">All source types</option>
              <option value="note">Note</option>
              <option value="url">URL</option>
              <option value="reddit">Reddit</option>
              <option value="trustpilot">Trustpilot</option>
              <option value="screenshot">Screenshot</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{entry.target_name}</div>
                    <div className="max-w-md truncate text-xs text-gray-400">{entry.raw_text}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">{typeLabel(entry.type)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-700">{sourceLabel(entry.source_type)}</div>
                    {entry.source_url ? <div className="mt-0.5 max-w-[180px] truncate text-xs text-gray-400">{entry.source_url}</div> : <div className="mt-0.5 text-xs text-gray-400">No URL</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-full bg-lime-50 px-2 py-0.5 text-xs font-bold text-lime-700">{countExtractedItems(entry)} signals</span>
                      {extractedCount(entry, "complaints") > 0 ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">{extractedCount(entry, "complaints")} complaints</span> : null}
                      {extractedCount(entry, "payoutMentions") > 0 ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{extractedCount(entry, "payoutMentions")} payouts</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.length ? entry.tags.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{tag}</span>) : <span className="text-gray-300">none</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{daysSince(entry.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/app/admin/research/${entry.id}`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50">View</Link>
                      <button type="button" onClick={() => editEntry(entry)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50">Edit</button>
                      <button type="button" onClick={() => deleteEntry(entry.id)} className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <div className="py-12 text-center text-sm font-semibold text-gray-500">No research entries match these filters.</div> : null}
        </div>
      </section>
    </div>
  );
}
