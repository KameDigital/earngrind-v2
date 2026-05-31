import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { indexFollowRobots } from "@/lib/seo-metadata";
import { StaticGuideShell } from "../StaticGuideShell";

const PAGE_PATH = "/guides/lords-mobile";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const MARKDOWN_PATH = path.join(process.cwd(), "guides", "lords-mobile", "index.md");
const TITLE = "Lords Mobile Guide: Beginner Strategy, Academy, Heroes, Castle, and Fast Progression";
const DESCRIPTION =
    "Lords Mobile guide for beginners: castle upgrades, Academy research, heroes, troops, guilds, monster hunt, resources, spending, codes, and fast progression.";

export const dynamic = "force-static";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
        canonical: PAGE_URL,
    },
    robots: indexFollowRobots(),
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
        type: "article",
    },
    twitter: {
        card: "summary",
        title: TITLE,
        description: DESCRIPTION,
    },
};

function readGuideBody() {
    return fs
        .readFileSync(MARKDOWN_PATH, "utf8")
        .replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "")
        .trimStart()
        .replace(/^#\s+.+(?:\r?\n)+/, "");
}

export default function LordsMobileGuidePage() {
    const markdown = readGuideBody();

    return (
        <StaticGuideShell
            title={TITLE}
            description={DESCRIPTION}
            eyebrow="Lords Mobile Strategy Guide"
            gameName="Lords Mobile: Kingdom Wars"
            markdown={markdown}
            badges={["Beginner Guide", "Android and iOS", "Academy Focus"]}
            facts={[
                { label: "Game", value: "Lords Mobile: Kingdom Wars" },
                { label: "Platform", value: "Android and iOS" },
                { label: "Core progression", value: "Castle, Academy, Research, Heroes" },
                { label: "Best early priority", value: "Academy progress and compounding queues" },
            ]}
            highlights={[
                "Academy research is the long-term progression engine.",
                "Join an active guild before pushing timers or monster hunting.",
                "Offerwall players should read the CPAlead guide before spending.",
            ]}
            primaryCta={{
                href: "/guides/lords-mobile-cpalead-offer-guide",
                label: "Read CPAlead Offer Guide",
            }}
            secondaryCta={{ href: "/guides", label: "All Guides" }}
        />
    );
}
