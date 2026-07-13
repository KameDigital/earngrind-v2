"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";

type Item = { id: string; offer_id: string; offer_source: "ingested" | "manual"; is_active: boolean; display_priority: number; badge: string | null; placement: string };
type Candidate = { id: string; source: "ingested" | "manual"; title: string; game_name: string | null; platform_name: string | null; provider_name: string | null; payout_usd: number; image_url: string | null };

async function mutate(body: Record<string, unknown>) {
  const response = await fetch("/api/admin/homepage-featured", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? "Could not save changes.");
}

export default function HomepageFeaturedManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [displayLimit, setDisplayLimit] = useState(8);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/homepage-featured");
    const json = await response.json();
    if (response.ok) { setItems(json.items); setDisplayLimit(json.display_limit); }
    else setMessage(json.error ?? "Could not load featured games.");
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (query.trim().length < 2) { setCandidates([]); return; }
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/admin/homepage-featured/candidates?q=${encodeURIComponent(query)}`);
      const json = await response.json();
      setCandidates(response.ok ? json.data : []);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const run = async (body: Record<string, unknown>) => {
    setMessage(null);
    try { await mutate(body); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save changes."); }
  };
  const move = (item: Item, direction: -1 | 1) => {
    const index = items.findIndex((entry) => entry.id === item.id);
    const neighbor = items[index + direction];
    if (!neighbor) return;
    void Promise.all([
      mutate({ action: "update", id: item.id, display_priority: neighbor.display_priority }),
      mutate({ action: "update", id: neighbor.id, display_priority: item.display_priority }),
    ]).then(load).catch((error) => setMessage(error.message));
  };

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-lime-50 p-6 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Homepage collection</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Weekly Top Games</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">This is a manual homepage list. Imported offers never appear here until you add them, and changing this collection never edits the offer database.</p>
    </header>

    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-extrabold text-gray-950">Add an existing offer</h2><p className="mt-1 text-sm text-gray-500">Search the inventory, then add the exact route to this week&apos;s picks.</p></div>
        <label className="text-sm font-bold text-gray-700">Homepage limit <input className="ml-2 w-16 rounded-lg border border-gray-300 px-2 py-1.5" type="number" min="1" max="48" value={displayLimit} onChange={(event) => setDisplayLimit(Number(event.target.value))} onBlur={() => void run({ action: "settings", display_limit: displayLimit })} /></label>
      </div>
      <div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-100" placeholder="Search games or offer titles…" /></div>
      {candidates.length > 0 && <div className="mt-2 divide-y rounded-xl border border-gray-200">{candidates.map((candidate) => <div key={`${candidate.source}:${candidate.id}`} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{candidate.game_name || candidate.title}</p><p className="truncate text-xs text-gray-500">{candidate.platform_name}{candidate.provider_name ? ` · ${candidate.provider_name}` : ""} · ${Number(candidate.payout_usd).toFixed(2)}</p></div><button onClick={() => void run({ action: "add", offer_id: candidate.id, offer_source: candidate.source, display_priority: (items.at(-1)?.display_priority ?? 0) + 10 })} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-700"><Plus className="h-3.5 w-3.5" /> Add</button></div>)}</div>}
    </section>

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 px-5 py-4"><h2 className="font-extrabold text-gray-950">Published order</h2><p className="mt-1 text-sm text-gray-500">Only active Weekly Top Games count toward the homepage limit.</p></div>
      {message && <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
      {loading ? <p className="p-6 text-sm text-gray-500">Loading collection…</p> : items.length === 0 ? <p className="p-6 text-sm text-gray-500">No featured games yet. Search above to build this week&apos;s list.</p> : <div className="divide-y divide-gray-100">{items.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-3 p-4"><div className="w-7 text-center text-xs font-extrabold text-gray-400">{index + 1}</div><div className="min-w-[10rem] flex-1"><p className="font-bold text-gray-900">{item.offer_source} offer</p><p className="font-mono text-xs text-gray-400">{item.offer_id}</p></div><input aria-label="Featured badge" className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" placeholder="Badge (optional)" defaultValue={item.badge ?? ""} onBlur={(event) => void run({ action: "update", id: item.id, badge: event.target.value })} /><label className="flex items-center gap-2 text-xs font-bold text-gray-600"><input type="checkbox" checked={item.is_active} onChange={(event) => void run({ action: "update", id: item.id, is_active: event.target.checked })} /> Active</label><div className="flex gap-1"><button aria-label="Move up" disabled={index === 0} onClick={() => move(item, -1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(item, 1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button aria-label="Remove from homepage" onClick={() => void run({ action: "remove", id: item.id })} className="rounded border border-red-200 p-1.5 text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
    </section>
  </div>;
}
