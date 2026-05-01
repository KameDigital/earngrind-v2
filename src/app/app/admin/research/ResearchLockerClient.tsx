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

  async function saveEntry() {
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
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Structured research</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              Store reusable platform, game, offer, and general research so generated reviews can cite real patterns without inventing claims.
            </p>
          </div>
          <Link href="/app/admin/guides/batch-generate" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800">
            Generate Review
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Import From URL</p>
            <h2 className="mt-1 text-sm font-extrabold text-gray-900">Fetch & Extract Research</h2>
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
        <h2 className="text-sm font-extrabold text-gray-900">{form.id ? "Edit Research" : "Add Research"}</h2>
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
          <h2 className="text-sm font-extrabold text-gray-900">Research List</h2>
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
                  <td className="px-4 py-3 capitalize text-gray-600">{entry.type}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{entry.source_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.length ? entry.tags.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{tag}</span>) : <span className="text-gray-300">none</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(entry.updated_at).toLocaleDateString()}</td>
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
