import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { indexFollowRobots } from "@/lib/seo-metadata";
import { StaticGuideShell } from "../StaticGuideShell";

const PAGE_PATH = "/guides/lords-mobile-cpalead-offer-guide";
const PAGE_URL = absoluteUrl(PAGE_PATH);
const MARKDOWN_PATH = path.join(process.cwd(), "guides", "lords-mobile-cpalead-offer-guide", "index.md");
const TITLE = "Lords Mobile CPAlead Offer Guide";
const DESCRIPTION =
    "Lords Mobile CPAlead offer guide with payouts, proof steps, Academy 25 warnings, level 60 route, spend timing traps, and Android tracking checklist for US.";

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

export default function LordsMobileCpaleadOfferGuidePage() {
    const markdown = readGuideBody();

    return (
        <StaticGuideShell
            title={TITLE}
            description={DESCRIPTION}
            eyebrow="CPAlead Offer Route"
            gameName="Lords Mobile: Kingdom Wars"
            markdown={markdown}
            badges={["CPAlead", "US Android", "383,653 Points"]}
            facts={[
                { label: "Provider", value: "CPAlead" },
                { label: "Country / device", value: "US Android" },
                { label: "Total listed value", value: "383,653 points / $383.65" },
                { label: "Make-or-break tasks", value: "Academy 25 in 21 days and Character 60 in 25 days" },
            ]}
            highlights={[
                "Start with free tasks as a tracking test before spending.",
                "The $29.99 New Kingdom pack only counts from day 8 onward.",
                "Academy 25 and Character 60 decide whether the offer is worth continuing.",
            ]}
            primaryCta={{ href: "/offers", label: "Compare Current Offers" }}
            secondaryCta={{ href: "/guides/lords-mobile", label: "Read Game Guide" }}
        />
    );
}
