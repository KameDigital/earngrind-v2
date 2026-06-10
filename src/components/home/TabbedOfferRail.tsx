"use client";

import { useMemo, useState } from "react";
import FeaturedOfferRail, { type FeaturedOfferRailItem } from "@/components/home/FeaturedOfferRail";

export type OfferRailTab = {
  id: string;
  label: string;
  description: string;
  items: FeaturedOfferRailItem[];
};

export default function TabbedOfferRail({ tabs }: { tabs: OfferRailTab[] }) {
  const availableTabs = useMemo(() => tabs.filter((tab) => tab.items.length > 0), [tabs]);
  const [activeTabId, setActiveTabId] = useState(() => availableTabs[0]?.id ?? tabs[0]?.id ?? "");
  const activeTab = availableTabs.find((tab) => tab.id === activeTabId) ?? availableTabs[0];

  if (!activeTab) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label="Featured offer platforms">
        {availableTabs.map((tab) => {
          const active = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex-shrink-0 rounded-lg border px-4 py-2 text-xs font-extrabold transition ${
                active
                  ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-lime)]"
                  : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-lime-300 hover:text-[var(--brand-ink)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <FeaturedOfferRail
        items={activeTab.items}
        title={activeTab.label}
        description={activeTab.description}
      />
    </div>
  );
}
