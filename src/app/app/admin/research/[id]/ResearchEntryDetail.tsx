"use client";

import Image from "next/image";
import { useState } from "react";

type ResearchEntry = {
  id: string;
  target_name: string;
  type: string;
  source_type: string;
  source_url: string | null;
  image_url: string | null;
  raw_text: string;
  extracted_data: unknown;
  tags: string[];
  updated_at: string;
};

const EXTRACTED_LABELS: Record<string, string> = {
  payoutMentions: "Payout Mentions",
  complaints: "Complaints",
  trustSignals: "Trust Signals",
  requirements: "Requirements",
  risks: "Risks",
  paymentMethods: "Payment Methods",
};

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function extractedSections(value: unknown) {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.entries(EXTRACTED_LABELS).map(([key, label]) => ({
    key,
    label,
    values: asStringArray(data[key]),
  }));
}

function sourceLabel(value: string) {
  if (value === "trustpilot") return "Trustpilot";
  if (value === "reddit") return "Reddit";
  if (value === "screenshot") return "Screenshot";
  if (value === "url") return "URL";
  return "Manual note";
}

export default function ResearchEntryDetail({ entry }: { entry: ResearchEntry }) {
  const [tags, setTags] = useState(entry.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveTags() {
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/admin/research/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetName: entry.target_name,
        type: entry.type,
        sourceType: entry.source_type,
        sourceUrl: entry.source_url,
        imageUrl: entry.image_url,
        rawText: entry.raw_text,
        tags,
      }),
    });
    setSaving(false);
    setMessage(response.ok ? "Tags saved." : "Tag update failed.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Research summary</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use this page to confirm what the source actually says before generating or refreshing content.
            </p>
          </div>
          {entry.source_url ? (
            <a href={entry.source_url} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Open source URL
            </a>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-3"><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Target</dt><dd className="mt-1 font-semibold text-gray-900">{entry.target_name}</dd></div>
          <div className="rounded-xl bg-gray-50 p-3"><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Source</dt><dd className="mt-1 text-gray-700">{sourceLabel(entry.source_type)}</dd></div>
          <div className="rounded-xl bg-gray-50 p-3"><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Type</dt><dd className="mt-1 capitalize text-gray-700">{entry.type}</dd></div>
          <div className="rounded-xl bg-gray-50 p-3"><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Updated</dt><dd className="mt-1 text-gray-700">{new Date(entry.updated_at).toLocaleString()}</dd></div>
        </dl>
        {entry.image_url ? (
          <div className="relative mt-4 h-96 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <Image src={entry.image_url} alt={`${entry.target_name} research screenshot`} fill sizes="(max-width: 768px) 100vw, 900px" className="object-contain" />
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">Editable Tags</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          <button type="button" onClick={saveTags} disabled={saving} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Save Tags"}</button>
        </div>
        {message ? <p className="mt-2 text-sm font-semibold text-gray-600">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-gray-900">Extracted evidence</h2>
        <p className="mt-1 text-sm text-gray-500">
          These are machine-extracted signals. Treat them as a checklist, then verify against the raw source below.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {extractedSections(entry.extracted_data).map((section) => (
            <div key={section.key} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-gray-900">{section.label}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500">{section.values.length}</span>
              </div>
              {section.values.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {section.values.slice(0, 8).map((item, index) => (
                    <li key={`${section.key}-${index}`} className="rounded-lg bg-white px-3 py-2">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-400">None detected.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <details open>
          <summary className="cursor-pointer text-lg font-extrabold text-gray-900">Raw content</summary>
          <pre className="mt-4 max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">{entry.raw_text || "No raw text saved."}</pre>
        </details>
      </section>
    </div>
  );
}
