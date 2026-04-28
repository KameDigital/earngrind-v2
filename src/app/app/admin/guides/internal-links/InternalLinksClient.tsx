"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Suggestion = {
  label: string;
  href: string;
  reason?: string;
  type?: string;
};

type GuideRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  internalLinkCount: number;
  incomingLinkCount: number;
  suggestions: Suggestion[];
};

export default function InternalLinksClient({ guides }: { guides: GuideRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approveLinks(guide: GuideRow) {
    const selectedSuggestions = guide.suggestions.filter((suggestion) => selected[guide.id]?.[suggestion.href]);
    setSaving(guide.id);
    setError(null);
    const res = await fetch(`/api/admin/guides/${guide.id}/internal-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestions: selectedSuggestions }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) {
      setError(json.error ?? "Could not insert links.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      {guides.map((guide) => (
        <article key={guide.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">{guide.title}</h2>
              <p className="mt-1 text-xs font-mono text-gray-400">{guide.slug}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2 py-1 font-bold text-gray-600">{guide.status}</span>
                <span className="rounded-full bg-lime-100 px-2 py-1 font-bold text-lime-900">{guide.internalLinkCount} internal links</span>
                <span className="rounded-full bg-blue-100 px-2 py-1 font-bold text-blue-900">{guide.incomingLinkCount} incoming links</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => approveLinks(guide)}
              disabled={saving === guide.id || !guide.suggestions.some((suggestion) => selected[guide.id]?.[suggestion.href])}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving === guide.id ? "Inserting..." : "Insert approved links"}
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {guide.suggestions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No stored suggestions for this guide yet.</p>
            ) : guide.suggestions.map((suggestion) => (
              <label key={suggestion.href} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 text-sm hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={Boolean(selected[guide.id]?.[suggestion.href])}
                  onChange={(event) => setSelected((current) => ({
                    ...current,
                    [guide.id]: {
                      ...(current[guide.id] ?? {}),
                      [suggestion.href]: event.target.checked,
                    },
                  }))}
                />
                <span>
                  <span className="font-bold text-gray-900">{suggestion.label}</span>
                  <span className="ml-2 font-mono text-xs text-gray-400">{suggestion.href}</span>
                  {suggestion.reason ? <span className="mt-1 block text-xs text-gray-500">{suggestion.reason}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </article>
      ))}
      {guides.length === 0 ? <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm font-semibold text-gray-500">No guides need link review right now.</div> : null}
    </div>
  );
}
