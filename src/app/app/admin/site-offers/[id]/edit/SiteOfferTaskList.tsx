"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Task {
    id:              string;
    sort_order:      number;
    title:           string;
    reward_amount:   number;
    reward_display:  string | null;
    task_type:       string;
    time_limit_text: string | null;
    notes:           string | null;
}

interface SiteOfferTaskListProps {
    siteOfferId: string;
    initialTasks: Task[];
}

// ── Constants ────────────────────────────────────────────────────────────────
const TASK_TYPES = ["install","milestone","purchase","signup","other"] as const;

const TYPE_COLORS: Record<string, string> = {
    install:   "bg-blue-100 text-blue-700",
    milestone: "bg-green-100 text-green-700",
    purchase:  "bg-purple-100 text-purple-700",
    signup:    "bg-yellow-100 text-yellow-700",
    other:     "bg-gray-100 text-gray-500",
};

const EMPTY: Omit<Task, "id"> = {
    sort_order: 0, title: "", reward_amount: 0,
    reward_display: "", task_type: "milestone", time_limit_text: "", notes: "",
};

const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white transition";

// ── TaskForm ─────────────────────────────────────────────────────────────────
// IMPORTANT: This MUST be defined at module level (outside SiteOfferTaskList).
// If defined inside the parent component's render function, React treats it as
// a new component type on every render, causing unmount/remount after each
// keystroke — which is what was causing the "type 1 char then lose focus" bug.
interface TaskFormProps {
    form:       Omit<Task, "id">;
    onChange:   (k: keyof Omit<Task, "id">, v: unknown) => void;
    onSave:     () => void;
    onCancel:   () => void;
    saving:     boolean;
    isEditing:  boolean;
    error:      string | null;
}

function TaskForm({ form, onChange, onSave, onCancel, saving, isEditing, error }: TaskFormProps) {
    return (
        <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                {isEditing ? "Edit Task" : "New Task"}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => onChange("title", e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Reach Town Hall 10"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                        value={form.task_type}
                        onChange={e => onChange("task_type", e.target.value)}
                        className={inputClass}
                    >
                        {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reward ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.reward_amount}
                        onChange={e => onChange("reward_amount", e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Display <span className="text-gray-400">(opt.)</span>
                    </label>
                    <input
                        type="text"
                        value={form.reward_display ?? ""}
                        onChange={e => onChange("reward_display", e.target.value)}
                        className={inputClass}
                        placeholder="e.g. +142 gems"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                    <input
                        type="number"
                        min="0"
                        value={form.sort_order}
                        onChange={e => onChange("sort_order", Number(e.target.value))}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Time Limit <span className="text-gray-400">(opt.)</span>
                    </label>
                    <input
                        type="text"
                        value={form.time_limit_text ?? ""}
                        onChange={e => onChange("time_limit_text", e.target.value)}
                        className={inputClass}
                        placeholder="e.g. within 30 days"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes <span className="text-gray-400">(opt.)</span>
                    </label>
                    <input
                        type="text"
                        value={form.notes ?? ""}
                        onChange={e => onChange("notes", e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            {error && <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                >
                    {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Task"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── SiteOfferTaskList ────────────────────────────────────────────────────────
export default function SiteOfferTaskList({ siteOfferId, initialTasks }: SiteOfferTaskListProps) {
    const [tasks,   setTasks]   = useState<Task[]>(initialTasks);
    const [editId,  setEditId]  = useState<string | null>(null);
    const [form,    setForm]    = useState<Omit<Task, "id">>(EMPTY);
    const [showAdd, setShowAdd] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    function openEdit(task: Task) {
        setEditId(task.id);
        setForm({ ...task });
        setShowAdd(false);
        setError(null);
    }

    function openAdd() {
        setEditId(null);
        setForm({ ...EMPTY, sort_order: tasks.length });
        setShowAdd(true);
        setError(null);
    }

    function closeForm() {
        setEditId(null);
        setShowAdd(false);
        setError(null);
    }

    function updateForm(k: keyof typeof form, v: unknown) {
        setForm(prev => ({ ...prev, [k]: v }));
    }

    async function handleSave() {
        if (!form.title.trim()) { setError("Title is required"); return; }
        setSaving(true); setError(null);

        if (editId) {
            const res = await fetch(`/api/admin/site-offer-tasks/${editId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, reward_amount: Number(form.reward_amount) }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Save failed"); setSaving(false); return; }
            setTasks(prev => prev.map(t => t.id === editId ? json.task : t));
            setEditId(null);
        } else {
            const res = await fetch("/api/admin/site-offer-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, site_offer_id: siteOfferId, reward_amount: Number(form.reward_amount) }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Create failed"); setSaving(false); return; }
            setTasks(prev => [...prev, json.task].sort((a, b) => a.sort_order - b.sort_order));
            setShowAdd(false);
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this task?")) return;
        const res = await fetch(`/api/admin/site-offer-tasks/${id}`, { method: "DELETE" });
        if (res.ok) setTasks(prev => prev.filter(t => t.id !== id));
    }

    return (
        <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Tasks / Goals</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Steps the user must complete for this offer</p>
                </div>
                {!showAdd && editId === null && (
                    <button
                        type="button"
                        onClick={openAdd}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        + Add Task
                    </button>
                )}
            </div>

            {showAdd && (
                <div className="mb-4">
                    <TaskForm
                        form={form}
                        onChange={updateForm}
                        onSave={handleSave}
                        onCancel={closeForm}
                        saving={saving}
                        isEditing={false}
                        error={error}
                    />
                </div>
            )}

            {tasks.length === 0 && !showAdd && (
                <div className="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">
                    No tasks yet.{" "}
                    <button
                        type="button"
                        onClick={openAdd}
                        className="text-blue-600 hover:underline"
                    >
                        Add the first goal →
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {tasks.map(task => (
                    <div key={task.id}>
                        {editId === task.id ? (
                            <TaskForm
                                form={form}
                                onChange={updateForm}
                                onSave={handleSave}
                                onCancel={closeForm}
                                saving={saving}
                                isEditing={true}
                                error={error}
                            />
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                                <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">#{task.sort_order}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-800">{task.title}</span>
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TYPE_COLORS[task.task_type] ?? "bg-gray-100 text-gray-500"}`}>
                                            {task.task_type}
                                        </span>
                                        {task.time_limit_text && (
                                            <span className="text-xs text-gray-400">⏱ {task.time_limit_text}</span>
                                        )}
                                    </div>
                                    {task.notes && <div className="text-xs text-gray-400 mt-0.5">{task.notes}</div>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-bold text-gray-800">${Number(task.reward_amount).toFixed(2)}</div>
                                    {task.reward_display && <div className="text-xs text-gray-400">{task.reward_display}</div>}
                                </div>
                                <div className="flex gap-3 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(task)}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(task.id)}
                                        className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
