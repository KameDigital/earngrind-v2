"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

type Result = {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    href: string;
};

const quickActions = [
    { label: "Create guide", href: "/app/admin/guides/new" },
    { label: "Create manual offer", href: "/app/admin/site-offers/new" },
    { label: "Import GSC CSV", href: "/app/admin/seo/search-console-import" },
    { label: "Open action plan", href: "/app/admin/seo/action-plan" },
];

export default function AdminSearch() {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    const trimmed = query.trim();
    const showQuickActions = trimmed.length < 2;

    useEffect(() => {
        function onKeydown(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpen(true);
                window.setTimeout(() => {
                    const input = document.getElementById("admin-global-search");
                    if (input instanceof HTMLInputElement) input.focus();
                }, 0);
            }
            if (event.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKeydown);
        return () => window.removeEventListener("keydown", onKeydown);
    }, []);

    useEffect(() => {
        function onPointerDown(event: PointerEvent) {
            if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, []);

    useEffect(() => {
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, {
                    signal: controller.signal,
                });
                const json = await response.json();
                setResults(Array.isArray(json.results) ? json.results : []);
            } catch {
                if (!controller.signal.aborted) setResults([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 180);
        return () => {
            controller.abort();
            window.clearTimeout(timeout);
        };
    }, [trimmed]);

    const groupedResults = useMemo(() => {
        const groups = new Map<string, Result[]>();
        for (const result of results) {
            if (!groups.has(result.type)) groups.set(result.type, []);
            groups.get(result.type)?.push(result);
        }
        return Array.from(groups.entries());
    }, [results]);

    return (
        <div ref={boxRef} className="relative hidden w-full max-w-xl lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                id="admin-global-search"
                value={query}
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                placeholder="Search guides, offers, games, research..."
                className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-16 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                Ctrl K
            </span>

            {open ? (
                <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                    {showQuickActions ? (
                        <div className="p-2">
                            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                                Quick actions
                            </div>
                            {quickActions.map((action) => (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    onClick={() => setOpen(false)}
                                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                >
                                    {action.label}
                                </Link>
                            ))}
                        </div>
                    ) : loading ? (
                        <div className="px-4 py-5 text-sm font-semibold text-gray-500">Searching...</div>
                    ) : groupedResults.length > 0 ? (
                        <div className="max-h-[420px] overflow-y-auto p-2">
                            {groupedResults.map(([type, items]) => (
                                <div key={type} className="py-1">
                                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                                        {type}
                                    </div>
                                    {items.map((result) => (
                                        <Link
                                            key={`${result.type}-${result.id}`}
                                            href={result.href}
                                            onClick={() => setOpen(false)}
                                            className="block rounded-xl px-3 py-2 hover:bg-gray-50"
                                        >
                                            <div className="truncate text-sm font-bold text-gray-950">{result.title}</div>
                                            <div className="mt-0.5 truncate text-xs text-gray-500">{result.subtitle}</div>
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-5 text-sm font-semibold text-gray-500">No admin results found.</div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
