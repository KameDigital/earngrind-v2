"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface GameOption {
    id: string;
    name: string;
    slug: string;
}

interface GameComboboxProps {
    value: string;
    onChange: (nextGameId: string, option: GameOption | null) => void;
    labelClassName: string;
    inputClassName: string;
    hintClassName: string;
    required?: boolean;
    initialOption?: GameOption | null;
}

export default function GameCombobox({
    value,
    onChange,
    labelClassName,
    inputClassName,
    hintClassName,
    required = false,
    initialOption = null,
}: GameComboboxProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(initialOption?.name ?? "");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<GameOption[]>(initialOption ? [initialOption] : []);
    const [selected, setSelected] = useState<GameOption | null>(initialOption);

    useEffect(() => {
        if (!initialOption) return;
        if (value && value === initialOption.id) {
            setSelected(initialOption);
            if (!query) setQuery(initialOption.name);
            setResults((prev) => (prev.some((g) => g.id === initialOption.id) ? prev : [initialOption, ...prev]));
        }
    }, [initialOption, query, value]);

    useEffect(() => {
        function onClickOutside(evt: MouseEvent) {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(evt.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        const q = query.trim();
        if (!open) return;

        const timer = setTimeout(async () => {
            if (q.length < 2) {
                setLoading(false);
                if (selected) setResults([selected]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/admin/games/search?q=${encodeURIComponent(q)}&limit=15`, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error("search failed");
                const json = await res.json();
                const fetched = Array.isArray(json.data) ? (json.data as GameOption[]) : [];

                const merged = selected && !fetched.some((g) => g.id === selected.id)
                    ? [selected, ...fetched]
                    : fetched;
                setResults(merged);
            } catch {
                setResults(selected ? [selected] : []);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [open, query, selected]);

    const visibleResults = useMemo(() => {
        if (!open) return [];
        if (query.trim().length < 2 && selected) return [selected];
        return results;
    }, [open, query, results, selected]);

    function handlePick(option: GameOption) {
        setSelected(option);
        setQuery(option.name);
        onChange(option.id, option);
        setOpen(false);
    }

    function clearSelection() {
        setSelected(null);
        setQuery("");
        setResults([]);
        onChange("", null);
        setOpen(true);
    }

    return (
        <div ref={wrapperRef}>
            <label className={labelClassName}>Game {required ? "*" : ""}</label>

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    placeholder="Search by game name, slug, or alias…"
                    className={inputClassName}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    aria-controls="game-search-listbox"
                />

                {selected ? (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
                    >
                        Clear
                    </button>
                ) : null}

                {open ? (
                    <div
                        id="game-search-listbox"
                        role="listbox"
                        className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                    >
                        {loading ? (
                            <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
                        ) : visibleResults.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500">
                                {query.trim().length < 2 ? "Type at least 2 characters to search." : "No games found."}
                            </div>
                        ) : (
                            visibleResults.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="option"
                                    aria-selected={value === option.id}
                                    onClick={() => handlePick(option)}
                                    className={`flex w-full items-start justify-between px-3 py-2 text-left hover:bg-gray-50 ${
                                        value === option.id ? "bg-gray-50" : ""
                                    }`}
                                >
                                    <span className="text-sm font-medium text-gray-800">{option.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">{option.slug}</span>
                                </button>
                            ))
                        )}
                    </div>
                ) : null}
            </div>

            <p className={hintClassName}>
                {selected
                    ? `Selected: ${selected.name} (${selected.slug})`
                    : "Search and choose a game. The guide stores games.id as game_id."}
            </p>
        </div>
    );
}
