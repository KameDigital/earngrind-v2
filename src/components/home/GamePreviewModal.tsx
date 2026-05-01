"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type RailPreviewTask = {
  title: string;
  rewardDisplay?: string | null;
  timeLimitText?: string | null;
  sortOrder?: number | null;
};

export type RailPreviewRoute = {
  offerId: string;
  href: string;
  providerName?: string | null;
  platformName?: string | null;
  payout?: string | null;
  payoutValue?: number | null;
  taskCount?: number | null;
  tasks: RailPreviewTask[];
};

export type RailPreviewData = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  gameHref: string;
  guideHref?: string | null;
  routes: RailPreviewRoute[];
};

function TaskListPanel({ tasks }: { tasks: RailPreviewTask[] }) {
  const visibleTasks = tasks.length > 0 ? tasks : [{ title: "Review the live offer requirements before starting." }];

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-3">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Milestones</div>
          <div className="text-sm font-bold text-[var(--brand-ink)]">{visibleTasks.length} task{visibleTasks.length === 1 ? "" : "s"} shown</div>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {visibleTasks.map((task, index) => (
          <div key={`${task.title}-${index}`} className="grid grid-cols-[auto_1fr] gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--surface-muted)]">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-lime-100 text-xs font-extrabold text-lime-800">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-snug text-[var(--brand-ink)]">{task.title}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                {task.rewardDisplay ? <span className="font-bold text-lime-700">{task.rewardDisplay}</span> : null}
                {task.timeLimitText ? <span>{task.timeLimitText}</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformChoiceStep({
  routes,
  selectedRouteId,
  onSelect,
}: {
  routes: RailPreviewRoute[];
  selectedRouteId: string | null;
  onSelect: (route: RailPreviewRoute) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-extrabold text-[var(--brand-ink)]">Choose a site to start</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Pick the payout route you want to try. Start buttons use EarnGrind&apos;s tracked redirect path.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {routes.map((route) => {
          const label = [route.platformName, route.providerName].filter(Boolean).join(" via ") || "Offer route";
          const active = route.offerId === selectedRouteId;
          return (
            <div key={route.offerId} className={`rounded-2xl border bg-white p-3 ${active ? "border-lime-300 shadow-[0_14px_28px_-22px_rgba(132,204,22,0.8)]" : "border-[var(--border-default)]"}`}>
              <button type="button" onClick={() => onSelect(route)} className="block w-full text-left">
                <div className="text-sm font-extrabold text-[var(--brand-ink)]">{label}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                  {route.payout ? <span className="font-bold text-lime-700">{route.payout}</span> : null}
                  {route.taskCount ? <span>{route.taskCount} task{route.taskCount === 1 ? "" : "s"}</span> : null}
                </div>
              </button>
              <a href={route.href} className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-black">
                Start
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewImage({ src, title }: { src?: string | null; title: string }) {
  if (!src) {
    return (
      <div className="flex h-full min-h-44 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(190,242,100,0.18),_rgba(17,24,39,0.95))] text-3xl font-extrabold uppercase tracking-[0.18em] text-white/80">
        {title.slice(0, 2)}
      </div>
    );
  }

  return <Image src={src} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />;
}

export default function GamePreviewModal({
  preview,
  onClose,
}: {
  preview: RailPreviewData;
  onClose: () => void;
}) {
  const sortedRoutes = useMemo(
    () => [...preview.routes].sort((a, b) => (b.payoutValue ?? 0) - (a.payoutValue ?? 0)),
    [preview.routes],
  );
  const defaultTaskRoute = useMemo(
    () => sortedRoutes.find((route) => route.tasks.length > 1) ?? sortedRoutes[0] ?? null,
    [sortedRoutes],
  );
  const [selectedRouteId, setSelectedRouteId] = useState(defaultTaskRoute?.offerId ?? null);
  const [step, setStep] = useState<"overview" | "platforms">("overview");
  const selectedRoute = sortedRoutes.find((route) => route.offerId === selectedRouteId) ?? sortedRoutes[0] ?? null;
  const primaryRoute = sortedRoutes[0] ?? null;

  useEffect(() => {
    setSelectedRouteId(defaultTaskRoute?.offerId ?? null);
    setStep("overview");
  }, [defaultTaskRoute?.offerId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function startNow() {
    if (!primaryRoute) return;
    if (sortedRoutes.length > 1) {
      setStep("platforms");
      return;
    }
    window.location.href = primaryRoute.href;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-[#f8faf4] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[#f8faf4]/95 px-5 py-4 backdrop-blur">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-lime-700">EarnGrind Preview</div>
            <h2 className="text-xl font-extrabold leading-tight text-[var(--brand-ink)]">{preview.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-white text-lg font-bold text-[var(--brand-ink)] hover:border-lime-300" aria-label="Close preview">
            X
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white">
              <div className="relative aspect-[1.15/1]">
                <PreviewImage src={preview.imageUrl} title={preview.title} />
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-white p-4">
              {preview.description ? <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{preview.description}</p> : null}
              {primaryRoute ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-lime-50 p-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-lime-700">Best payout</div>
                    <div className="mt-1 text-lg font-extrabold text-lime-800">{primaryRoute.payout ?? "Check live"}</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">Top route</div>
                    <div className="mt-1 truncate text-sm font-extrabold text-[var(--brand-ink)]">{[primaryRoute.platformName, primaryRoute.providerName].filter(Boolean).join(" via ") || "Available offer"}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {step === "platforms" ? (
              <PlatformChoiceStep
                routes={sortedRoutes}
                selectedRouteId={selectedRoute?.offerId ?? null}
                onSelect={(route) => setSelectedRouteId(route.offerId)}
              />
            ) : null}

            <TaskListPanel tasks={selectedRoute?.tasks ?? []} />

            <div className="grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={startNow} disabled={!primaryRoute} className="rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
                Start Best Route
              </button>
              <Link href={preview.gameHref} className="rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-center text-sm font-extrabold text-[var(--brand-ink)] hover:border-lime-300">
                View Game Page
              </Link>
              {preview.guideHref ? (
                <Link href={preview.guideHref} className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-center text-sm font-extrabold text-lime-800 hover:bg-lime-100">
                  Read Guide
                </Link>
              ) : null}
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
              Payouts can change by device, country, and provider rules. Some outbound links may be affiliate links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
