"use client";

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
        <h2 className="text-sm font-extrabold text-gray-900">Research Details</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Target</dt><dd className="mt-1 font-semibold text-gray-900">{entry.target_name}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Source</dt><dd className="mt-1 capitalize text-gray-700">{entry.source_type}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Type</dt><dd className="mt-1 capitalize text-gray-700">{entry.type}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-widest text-gray-400">Updated</dt><dd className="mt-1 text-gray-700">{new Date(entry.updated_at).toLocaleString()}</dd></div>
        </dl>
        {entry.source_url ? <a href={entry.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-blue-700 hover:underline">Open source URL</a> : null}
        {entry.image_url ? <img src={entry.image_url} alt={`${entry.target_name} research screenshot`} className="mt-4 max-h-96 rounded-xl border border-gray-200 object-contain" /> : null}
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
        <h2 className="text-sm font-extrabold text-gray-900">Extracted Structured Data</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-relaxed text-gray-100">{JSON.stringify(entry.extracted_data, null, 2)}</pre>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-gray-900">Raw Content</h2>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">{entry.raw_text || "No raw text saved."}</pre>
      </section>
    </div>
  );
}
