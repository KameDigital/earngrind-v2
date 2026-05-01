"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ContentQueueRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  contentStatus: string;
  keywordTarget: string | null;
  batchName: string | null;
  opportunityScore: number | null;
  seoScore: number;
  internalLinkCount: number;
  hasFaq: boolean;
  plannedPublishDate: string | null;
  publishPriority: number | null;
  assignedTo: string | null;
  editorNotes: string | null;
  needsVariation: boolean | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  needs_edit: "Needs Edit",
  ready_to_publish: "Ready To Publish",
  scheduled: "Scheduled",
  published: "Published",
};

const inputClass = "rounded-lg border border-gray-200 px-3 py-2 text-sm";

function thisWeekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function inRange(dateString: string | null, start: Date, end: Date) {
  if (!dateString) return false;
  const date = new Date(`${dateString}T12:00:00`);
  return date >= start && date <= end;
}

export default function ContentQueueClient({ initialRows }: { initialRows: ContentQueueRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishPriority, setPublishPriority] = useState("");
  const [plannedPublishDate, setPlannedPublishDate] = useState("");
  const [contentStatus, setContentStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [editorNotes, setEditorNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.has(row.id)), [rows, selectedIds]);
  const thisWeek = thisWeekBounds(0);
  const nextWeek = thisWeekBounds(1);

  function replaceRows(ids: string[], patch: Partial<ContentQueueRow>) {
    setRows((current) => current.map((row) => ids.includes(row.id) ? { ...row, ...patch } : row));
  }

  async function runAction(action: string, extra: Record<string, unknown> = {}) {
    const ids = Array.from(selectedIds);
    if (action !== "auto_prioritize" && ids.length === 0) {
      setError("Select at least one guide.");
      return;
    }
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/content-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids, ...extra }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.checks ? `${json.error} ${json.checks.flatMap((check: { fixes: string[] }) => check.fixes).join(" ")}` : json.error ?? "Action failed.");
      if (action === "mark_ready" && json.checks) {
        replaceRows(json.checks.filter((check: { ok: boolean }) => !check.ok).map((check: { guideId: string }) => check.guideId), { contentStatus: "needs_edit" });
      }
      return;
    }
    setMessage(`${json.updated ?? ids.length} guide(s) updated.`);
    if (action === "mark_needs_edit") replaceRows(ids, { contentStatus: "needs_edit" });
    if (action === "mark_ready") replaceRows(ids, { contentStatus: "ready_to_publish" });
    if (action === "schedule") replaceRows(ids, { contentStatus: "scheduled", plannedPublishDate: String(extra.plannedPublishDate) });
    if (action === "publish") replaceRows(ids, { contentStatus: "published", status: "published" });
    if (action === "bulk_update") replaceRows(ids, {
      ...(extra.publishPriority ? { publishPriority: Number(extra.publishPriority) } : {}),
      ...(extra.plannedPublishDate ? { plannedPublishDate: String(extra.plannedPublishDate) } : {}),
      ...(extra.contentStatus ? { contentStatus: String(extra.contentStatus) } : {}),
      ...(extra.assignedTo !== undefined ? { assignedTo: String(extra.assignedTo || "") || null } : {}),
      ...(extra.editorNotes !== undefined ? { editorNotes: String(extra.editorNotes || "") || null } : {}),
    });
    if (action === "auto_prioritize") window.location.reload();
  }

  function toggle(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const grouped = ["draft", "needs_edit", "ready_to_publish", "scheduled", "published"].map((status) => ({
    status,
    rows: rows.filter((row) => row.contentStatus === status),
  }));
  const calendar = {
    thisWeek: rows.filter((row) => inRange(row.plannedPublishDate, thisWeek.start, thisWeek.end)),
    nextWeek: rows.filter((row) => inRange(row.plannedPublishDate, nextWeek.start, nextWeek.end)),
    unscheduled: rows.filter((row) => !row.plannedPublishDate && row.contentStatus !== "published"),
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">Bulk Actions</h2>
            <p className="mt-1 text-xs text-gray-500">{selectedRows.length} selected.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedIds(new Set(rows.map((row) => row.id)))} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Select all</button>
            <button onClick={() => setSelectedIds(new Set())} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Clear</button>
            <button onClick={() => runAction("auto_prioritize")} className="rounded-lg bg-lime-500 px-3 py-2 text-xs font-extrabold text-gray-950">Auto-Prioritize Drafts</button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input className={inputClass} value={publishPriority} onChange={(event) => setPublishPriority(event.target.value)} placeholder="Priority 1-100" type="number" />
          <input className={inputClass} value={plannedPublishDate} onChange={(event) => setPlannedPublishDate(event.target.value)} type="date" />
          <select className={inputClass} value={contentStatus} onChange={(event) => setContentStatus(event.target.value)}>
            <option value="">Status...</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input className={inputClass} value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Assigned to" />
          <input className={inputClass} value={editorNotes} onChange={(event) => setEditorNotes(event.target.value)} placeholder="Editor note" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => runAction("bulk_update", { publishPriority, plannedPublishDate, contentStatus, assignedTo, editorNotes })} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white">Apply Bulk Update</button>
          <button onClick={() => runAction("mark_ready")} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Mark Ready</button>
          <button onClick={() => runAction("schedule", { plannedPublishDate })} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Schedule</button>
          <button onClick={() => runAction("mark_needs_edit")} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Mark Needs Edit</button>
          <button onClick={() => runAction("publish")} className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-800">Publish</button>
        </div>
        {message ? <p className="mt-3 text-sm font-semibold text-green-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CalendarCard title="This Week" rows={calendar.thisWeek} />
        <CalendarCard title="Next Week" rows={calendar.nextWeek} />
        <CalendarCard title="Unscheduled" rows={calendar.unscheduled.slice(0, 12)} />
      </section>

      {grouped.map((group) => (
        <section key={group.status} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-sm font-extrabold text-gray-900">{STATUS_LABELS[group.status]} <span className="text-gray-400">({group.rows.length})</span></h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3 text-center">Opportunity</th>
                  <th className="px-4 py-3 text-center">SEO</th>
                  <th className="px-4 py-3">Planned</th>
                  <th className="px-4 py-3 text-center">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(row.id)} onChange={(event) => toggle(row.id, event.target.checked)} /></td>
                    <td className="px-4 py-3 min-w-[240px]"><div className="font-bold text-gray-900">{row.title}</div><div className="font-mono text-xs text-gray-400">{row.slug}</div></td>
                    <td className="px-4 py-3 min-w-[180px] text-gray-600">{row.keywordTarget ?? "n/a"}</td>
                    <td className="px-4 py-3 text-gray-500">{row.batchName ?? "n/a"}</td>
                    <td className="px-4 py-3 text-center">{row.opportunityScore ?? "-"}</td>
                    <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.seoScore >= 80 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{row.seoScore}</span></td>
                    <td className="px-4 py-3 text-gray-500">{row.plannedPublishDate ?? "Unscheduled"}</td>
                    <td className="px-4 py-3 text-center">{row.publishPriority ?? "-"}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{STATUS_LABELS[row.contentStatus] ?? row.contentStatus}</span></td>
                    <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Link href={`/app/admin/guides/${row.id}/edit`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">Edit</Link><Link href={`/guides/${row.slug}`} target="_blank" className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">Preview</Link></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {group.rows.length === 0 ? <div className="p-8 text-center text-sm font-semibold text-gray-500">No items in this status.</div> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

function CalendarCard({ title, rows }: { title: string; rows: ContentQueueRow[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={`${title}-${row.id}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="text-xs font-bold text-gray-900">{row.title}</div>
            <div className="mt-1 text-[11px] text-gray-500">{row.plannedPublishDate ?? "Unscheduled"} | P{row.publishPriority ?? "-"}</div>
          </div>
        ))}
        {rows.length === 0 ? <div className="text-sm text-gray-400">No items.</div> : null}
      </div>
    </div>
  );
}
