#!/usr/bin/env python3
"""
Build the Palmon: Survival guide upsert SQL from the four DOCX drafts.

Usage:
  Draft import for editorial review, default output path:
    python scripts/build-palmon-guide-import.py --docx-dir "C:\\path\\to\\Palmon"

  Draft import with a custom SQL output path:
    python scripts/build-palmon-guide-import.py --docx-dir "C:\\path\\to\\Palmon" --out tmp/palmon-draft.sql

  Published import, intentionally not the default:
    python scripts/build-palmon-guide-import.py --docx-dir "C:\\path\\to\\Palmon" --status published

Published mode is guarded because it can make guide rows public. Before using
--status published, populate SOURCE_URLS and clear unresolved critical claims
in CLAIMS_NEEDING_VERIFICATION below. Draft mode keeps published_at null and
surfaces source gaps for editorial review.

If --docx-dir is omitted, PALMON_DOCX_DIR must point to the folder containing
the four DOCX drafts.

The converter intentionally keeps the site format used by polished guide rows:
sanitized HTML in guides.body_md. It strips draft/admin sections and keeps the
guide body focused on publishable user-facing content.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
OUT_SQL = ROOT / "scripts" / "upsert-palmon-survival-guides.sql"

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

DRAFT_EDITOR_NOTES = (
    "Imported from expanded Palmon DOCX draft for editorial review. "
    "Keep draft until source URLs, payout/timing/camp-cost claims, route links, "
    "and offer matching behavior are reviewed."
)

PUBLISHED_EDITOR_NOTES = (
    "Imported from expanded Palmon DOCX draft after source and critical-claim review."
)

# Source URLs must be populated before --status published can generate SQL.
SOURCE_URLS: dict[str, list[str]] = {
    "palmon-survival-offerwall-guide": [],
    "palmon-survival-camp-30-guide": [],
    "palmon-survival-no-spend": [],
    "palmon-survival-not-crediting": [],
}

# Draft SQL carries these gaps into guides.claims_needing_verification so review
# work stays visible in the database row. Published SQL generation fails while
# any claim with severity=critical remains unresolved.
CLAIMS_NEEDING_VERIFICATION: dict[str, list[dict[str, str]]] = {
    "palmon-survival-offerwall-guide": [
        {
            "claim_type": "payout",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify current public Palmon payout amounts and provider-specific task values before publishing.",
        },
        {
            "claim_type": "timing",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify task deadlines and realistic completion windows for Camp milestones before publishing.",
        },
        {
            "claim_type": "source_gap",
            "severity": "critical",
            "status": "unresolved",
            "note": "Structured source_urls are empty; add exact citations for payout, milestone, and tracking claims.",
        },
    ],
    "palmon-survival-camp-30-guide": [
        {
            "claim_type": "camp_cost",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify Camp 22-30 resource, speedup, and spend estimates against cited sources before publishing.",
        },
        {
            "claim_type": "timing",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify Camp 26-30 timeline and wall claims before publishing.",
        },
        {
            "claim_type": "source_gap",
            "severity": "critical",
            "status": "unresolved",
            "note": "Structured source_urls are empty; add exact citations for Camp requirement and community-estimate claims.",
        },
    ],
    "palmon-survival-no-spend": [
        {
            "claim_type": "timing",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify no-spend milestone ranges and completion windows before publishing.",
        },
        {
            "claim_type": "community_estimate",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify free-player wall and Camp target estimates against cited sources before publishing.",
        },
        {
            "claim_type": "source_gap",
            "severity": "critical",
            "status": "unresolved",
            "note": "Structured source_urls are empty; add exact citations for no-spend strategy and milestone claims.",
        },
    ],
    "palmon-survival-not-crediting": [
        {
            "claim_type": "timing",
            "severity": "critical",
            "status": "unresolved",
            "note": "Verify tracking wait windows and support timing recommendations before publishing.",
        },
        {
            "claim_type": "source_gap",
            "severity": "critical",
            "status": "unresolved",
            "note": "Structured source_urls are empty; add exact citations for platform support and tracking guidance.",
        },
    ],
}


@dataclass(frozen=True)
class GuideSpec:
    file_name: str
    slug: str
    title: str
    card_description: str
    badge: str
    keyword_target: str
    keyword_intent: str
    difficulty: str
    estimated_time: str
    tips: list[str]
    checklist_items: list[str]
    publish_priority: int


GUIDES = [
    GuideSpec(
        file_name="Palmon_Survival_Offerwall_Guide_Expanded.docx",
        slug="palmon-survival-offerwall-guide",
        title="Palmon: Survival Offerwall Guide",
        card_description="Best payouts, Camp milestones, no-spend limits, tracking warnings, and whether the offer is worth it.",
        badge="Main Guide",
        keyword_target="Palmon Survival offerwall guide",
        keyword_intent="commercial_investigation",
        difficulty="hard",
        estimated_time="2-6 weeks depending on target",
        tips=[
            "Verify the live Palmon payout and task list before installing.",
            "Treat Camp 16-20 as the practical target zone and Camp 26+ as high risk.",
            "Screenshot the offer, milestones, player profile, and every completed Camp level.",
            "Do not spend heavily unless early milestones track and the remaining payout justifies it.",
        ],
        checklist_items=[
            "Compare current Palmon: Survival payouts",
            "Screenshot offer terms before install",
            "Rush required Camp upgrades only",
            "Reassess after Camp 20-22",
        ],
        publish_priority=10,
    ),
    GuideSpec(
        file_name="Palmon_Survival_Camp_30_Guide_Expanded.docx",
        slug="palmon-survival-camp-30-guide",
        title="Palmon Survival Camp 30 Guide",
        card_description="See why Camp 26 is the real wall and whether Camp 28-30 are worth chasing.",
        badge="High-Tier Strategy",
        keyword_target="Palmon Survival Camp 30",
        keyword_intent="task_specific",
        difficulty="hard",
        estimated_time="3-6+ weeks depending on spend and pace",
        tips=[
            "Use the in-game Camp upgrade screen as the final requirement source.",
            "Save speedups for long required blockers and Camp upgrade timers.",
            "Treat Camp 26 as the real wall and Camp 28-30 as heavy-spend territory.",
            "Stop if tracking is broken or the remaining payout no longer justifies the push.",
        ],
        checklist_items=[
            "Screenshot each required Camp blocker",
            "Keep builders active",
            "Claim guild aid before speedups",
            "Recalculate ROI before spending after Camp 22",
        ],
        publish_priority=9,
    ),
    GuideSpec(
        file_name="Palmon_Survival_No_Spend_Guide_Expanded.docx",
        slug="palmon-survival-no-spend",
        title="Palmon Survival No-Spend Guide",
        card_description="Realistic free-player targets, resource strategy, speedup timing, and when to stop.",
        badge="Free-to-Play",
        keyword_target="Palmon Survival no spend",
        keyword_intent="how_to",
        difficulty="hard",
        estimated_time="2-5 weeks depending on target",
        tips=[
            "Aim for realistic no-spend milestones first: Camp 6, 13, 16, and possibly 18-20.",
            "Keep builders, research, gathering, AP, guild aid, and daily activity moving.",
            "Save speedups and resource chests for required Camp blockers.",
            "Do not assume Camp 26-30 is realistic without spending.",
        ],
        checklist_items=[
            "Complete daily activity 200",
            "Claim free resources before caps",
            "Join an active guild",
            "Reassess before Camp 22+",
        ],
        publish_priority=8,
    ),
    GuideSpec(
        file_name="Palmon_Survival_Not_Crediting_Guide_Expanded.docx",
        slug="palmon-survival-not-crediting",
        title="Palmon Survival Not Crediting?",
        card_description="Tracking issues, screenshots, proof checklist, support tips, and when to stop spending.",
        badge="Tracking Help",
        keyword_target="Palmon Survival not crediting",
        keyword_intent="informational",
        difficulty="medium",
        estimated_time="10-20 minutes to review",
        tips=[
            "Screenshot the offer page, task list, payout, deadline, device rules, and player profile.",
            "Wait 24-48 hours before support unless the platform terms say otherwise.",
            "Do not spend heavily if early milestones fail to track.",
            "Send support clear timestamps, screenshots, account proof, and the exact missing milestone.",
        ],
        checklist_items=[
            "Save offer screenshots before install",
            "Screenshot every major Camp level",
            "Keep support ticket IDs",
            "Stop if early milestones fail and support rejects proof",
        ],
        publish_priority=7,
    ),
]


SKIP_HEADINGS = {
    "Page Setup",
    "Search Intent This Page Should Win",
    "Internal Links",
    "Sources Used for Expansion",
}

HEADING_TO_DROP_AFTER = {"Internal Links", "Sources Used for Expansion"}

DROP_PREFIXES = (
    "URL:",
    "SEO title:",
    "Meta description:",
    "Primary intent:",
    "CTA:",
)

RELATED = {
    "palmon-survival-offerwall-guide": [
        ("Palmon Survival Camp 30 guide", "/guides/palmon-survival-camp-30-guide"),
        ("Palmon Survival no-spend guide", "/guides/palmon-survival-no-spend"),
        ("Palmon Survival not crediting guide", "/guides/palmon-survival-not-crediting"),
        ("compare current Palmon: Survival payouts", "/games/palmon-survival"),
        ("browse more game guides", "/guides"),
        ("best GPT sites to make money", "/guides/best-gpt-sites-to-make-money"),
    ],
    "palmon-survival-camp-30-guide": [
        ("full Palmon: Survival offerwall guide", "/guides/palmon-survival-offerwall-guide"),
        ("Palmon Survival no-spend guide", "/guides/palmon-survival-no-spend"),
        ("Palmon Survival tracking issues", "/guides/palmon-survival-not-crediting"),
        ("compare current Palmon payouts", "/games/palmon-survival"),
    ],
    "palmon-survival-no-spend": [
        ("full Palmon: Survival offerwall guide", "/guides/palmon-survival-offerwall-guide"),
        ("Palmon Survival Camp 30 guide", "/guides/palmon-survival-camp-30-guide"),
        ("Palmon Survival not crediting guide", "/guides/palmon-survival-not-crediting"),
        ("compare current game offers", "/games/palmon-survival"),
        ("best GPT sites to make money", "/guides/best-gpt-sites-to-make-money"),
    ],
    "palmon-survival-not-crediting": [
        ("full Palmon: Survival offerwall guide", "/guides/palmon-survival-offerwall-guide"),
        ("Palmon Survival Camp 30 guide", "/guides/palmon-survival-camp-30-guide"),
        ("Palmon Survival no-spend guide", "/guides/palmon-survival-no-spend"),
        ("compare current game offers", "/games/palmon-survival"),
        ("best GPT sites to make money", "/guides/best-gpt-sites-to-make-money"),
    ],
}


def text_of(element: ET.Element) -> str:
    return "".join(node.text or "" for node in element.findall(".//w:t", NS)).strip()


def paragraph_style(paragraph: ET.Element) -> str:
    style = paragraph.find("./w:pPr/w:pStyle", NS)
    if style is None:
        return ""
    return style.attrib.get(f"{{{NS['w']}}}val", "")


def table_html(table: ET.Element) -> str:
    rows: list[list[str]] = []
    for row in table.findall("./w:tr", NS):
        cells = []
        for cell in row.findall("./w:tc", NS):
            parts = [normalize_text(text_of(p)) for p in cell.findall("./w:p", NS)]
            cells.append("<br />".join(html.escape(part) for part in parts if part))
        if any(cells):
            rows.append(cells)
    if not rows:
        return ""
    head = rows[0]
    body = rows[1:]
    out = ["<table>", "<thead>", "<tr>"]
    out.extend(f"<th>{cell}</th>" for cell in head)
    out.extend(["</tr>", "</thead>", "<tbody>"])
    for row in body:
        out.append("<tr>")
        out.extend(f"<td>{cell}</td>" for cell in row)
        out.append("</tr>")
    out.extend(["</tbody>", "</table>"])
    return "\n".join(out)


def doc_items(path: Path) -> list[tuple[str, str, str]]:
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    body = root.find(".//w:body", NS)
    if body is None:
        return []

    items: list[tuple[str, str, str]] = []
    for child in body:
        tag = child.tag.split("}")[-1]
        if tag == "p":
            text = text_of(child)
            if text:
                items.append(("p", paragraph_style(child), text))
        elif tag == "tbl":
            rendered = table_html(child)
            if rendered:
                items.append(("table", "", rendered))
    return items


def extract_metadata(items: Iterable[tuple[str, str, str]]) -> tuple[str, str]:
    seo_title = ""
    description = ""
    for kind, _style, text in items:
        if kind != "p":
            continue
        if text.startswith("SEO title:"):
            seo_title = text.split(":", 1)[1].strip()
        if text.startswith("Meta description:"):
            description = text.split(":", 1)[1].strip()
    return seo_title, description


def is_draft_line(text: str) -> bool:
    if any(text.startswith(prefix) for prefix in DROP_PREFIXES):
        return True
    if re.search(r"pull from live database if available", text, re.I):
        return True
    if text.startswith("Use this language on the live page:"):
        return True
    return False


def normalize_text(text: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2026": "...",
        "\u00a0": " ",
    }
    for before, after in replacements.items():
        text = text.replace(before, after)
    text = text.replace("publish day", "starting")
    return text


def user_facing_text(text: str) -> str | None:
    text = normalize_text(text)
    if text.startswith("Important warning: if the database payout is lower than the research max"):
        return (
            "If EarnGrind's live payout is lower than the research max, treat the live payout as the number that matters before starting. "
            "Headline payouts and current tracked payouts can differ by provider, country, device, boost, and account history."
        )
    if text.startswith("Exact Camp requirements should be verified in-game before publishing."):
        return text.replace(
            "Exact Camp requirements should be verified in-game before publishing.",
            "Exact Camp requirements should be verified in-game before spending resources.",
        )
    if text.startswith("Use this on-page disclaimer above any cost table:"):
        return "Late-game requirements and costs can change. Always verify the Camp upgrade screen in your own game before spending resources or money."
    if "on publish day" in text:
        text = text.replace("on publish day", "before starting")
    if 'add a "check active codes before starting" box' in text:
        text = text.replace('add a "check active codes before starting" box', "check active codes before starting")
    return text


def paragraph_html(text: str) -> str:
    text = normalize_text(text)
    escaped = html.escape(text)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    return f"<p>{escaped}</p>"


def flush_list(out: list[str], list_items: list[str]) -> None:
    if not list_items:
        return
    out.append("<ul>")
    out.extend(f"<li>{html.escape(item)}</li>" for item in list_items)
    out.append("</ul>")
    list_items.clear()


def convert_body(spec: GuideSpec, docx_dir: Path) -> tuple[str, str, str]:
    items = doc_items(docx_dir / spec.file_name)
    seo_title, description = extract_metadata(items)

    out: list[str] = []
    bullets: list[str] = []
    started = False
    drop_rest = False
    skip_current_heading = False

    out.append('<div class="guide-summary-box">')
    out.append(f"<strong>{html.escape(spec.badge)} quick answer:</strong>")
    out.append("<ul>")
    for item in spec.checklist_items:
        out.append(f"<li>{html.escape(item)}</li>")
    out.append("</ul>")
    out.append("</div>")

    for kind, style, text in items:
        if kind == "table":
            if started and not drop_rest and not skip_current_heading:
                flush_list(out, bullets)
                out.append(text)
            continue

        if style == "Title":
            continue

        if style.startswith("Heading"):
            flush_list(out, bullets)
            heading = normalize_text(text.strip())
            if heading in HEADING_TO_DROP_AFTER:
                drop_rest = True
                continue
            if heading in SKIP_HEADINGS:
                skip_current_heading = True
                continue
            skip_current_heading = False
            if not started and heading != "Intro":
                continue
            started = True
            level = 3 if style == "Heading2" else 2
            out.append(f"<h{level}>{html.escape(heading)}</h{level}>")
            continue

        if drop_rest or skip_current_heading or not started or is_draft_line(text):
            continue

        text = user_facing_text(text)
        if text is None:
            continue

        if style == "ListBullet":
            bullets.append(text)
        else:
            flush_list(out, bullets)
            out.append(paragraph_html(text))

    flush_list(out, bullets)

    out.append('<div class="guide-summary-box">')
    out.append(
        "<strong>Before you start:</strong> Payouts, deadlines, and task rules can change by provider, country, device, and account history. Verify the live Palmon: Survival offer terms before installing."
    )
    out.append("</div>")

    out.append("<h2>Related Palmon Guides</h2>")
    out.append("<ul>")
    for label, href in RELATED[spec.slug]:
        out.append(f'<li><a href="{href}">{html.escape(label)}</a></li>')
    out.append("</ul>")
    out.append(
        '<p>Some outbound offer links on EarnGrind may be affiliate links. Compare the live payout and task rules before spending time or money.</p>'
    )

    body = "\n".join(out).strip()
    return seo_title, description, body


def sql_string(value: str | None) -> str:
    if value is None:
        return "null"
    return "'" + value.replace("'", "''") + "'"


def sql_text_array(values: list[str]) -> str:
    if not values:
        return "'{}'::text[]"
    return "array[" + ", ".join(sql_string(value) for value in values) + "]::text[]"


def sql_jsonb(value: object) -> str:
    return sql_string(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def dollar_tag(slug: str) -> str:
    return "$" + slug.replace("-", "_") + "$"


def has_unresolved_critical_claims(claims: list[dict[str, str]]) -> bool:
    return any(
        claim.get("severity") == "critical" and claim.get("status") != "resolved"
        for claim in claims
    )


def validate_publish_ready() -> None:
    missing_sources = [slug for slug, urls in SOURCE_URLS.items() if not urls]
    unresolved = [
        slug
        for slug, claims in CLAIMS_NEEDING_VERIFICATION.items()
        if has_unresolved_critical_claims(claims)
    ]

    errors = []
    if missing_sources:
        errors.append("source_urls are empty for: " + ", ".join(missing_sources))
    if unresolved:
        errors.append("unresolved critical claims remain for: " + ", ".join(unresolved))

    if errors:
        raise SystemExit(
            "--status published is intentionally blocked until review is complete:\n"
            + "\n".join(f"- {error}" for error in errors)
        )


def resolve_docx_dir(docx_dir_arg: str | None) -> Path:
    value = docx_dir_arg or os.environ.get("PALMON_DOCX_DIR")
    if not value:
        raise SystemExit("Provide --docx-dir or set PALMON_DOCX_DIR.")

    docx_dir = Path(value).expanduser()
    if not docx_dir.is_dir():
        raise SystemExit(f"DOCX directory does not exist: {docx_dir}")

    missing = [spec.file_name for spec in GUIDES if not (docx_dir / spec.file_name).is_file()]
    if missing:
        raise SystemExit(
            "DOCX directory is missing required files:\n"
            + "\n".join(f"- {file_name}" for file_name in missing)
        )

    return docx_dir


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build draft-first Palmon: Survival guide import SQL from DOCX drafts."
    )
    parser.add_argument(
        "--docx-dir",
        help="Folder containing the four Palmon DOCX drafts. Falls back to PALMON_DOCX_DIR.",
    )
    parser.add_argument(
        "--out",
        default=str(OUT_SQL),
        help="Output SQL path. Defaults to scripts/upsert-palmon-survival-guides.sql.",
    )
    parser.add_argument(
        "--status",
        choices=("draft", "published"),
        default="draft",
        help="Generate draft SQL by default. Published mode is blocked until sources and critical claims are resolved.",
    )
    return parser.parse_args()


def build_sql(docx_dir: Path, status: str) -> str:
    if status == "published":
        validate_publish_ready()

    is_draft = status == "draft"
    row_status = "draft" if is_draft else "published"
    published_at = "null::timestamptz" if is_draft else "now()"
    editor_notes = DRAFT_EDITOR_NOTES if is_draft else PUBLISHED_EDITOR_NOTES
    header_status_note = (
        "Draft review import: rows stay unpublished with published_at null."
        if is_draft
        else "Published import: generated only after explicit --status published review gates passed."
    )
    published_at_update = (
        "published_at = excluded.published_at,"
        if is_draft
        else "published_at = coalesce(public.guides.published_at, excluded.published_at),"
    )

    rows = []
    for spec in GUIDES:
        seo_title, description, body = convert_body(spec, docx_dir)
        tag = dollar_tag(spec.slug)
        source_urls = SOURCE_URLS[spec.slug]
        claims = CLAIMS_NEEDING_VERIFICATION[spec.slug] if is_draft else []
        rows.append(
            "("
            f"\n    {sql_string(spec.title)},"
            f"\n    {sql_string(spec.slug)},"
            f"\n    {sql_string(spec.card_description)},"
            f"\n    {tag}\n{body}\n{tag},"
            "\n    'android'::public.device_type,"
            f"\n    {sql_string(spec.difficulty)},"
            f"\n    {sql_string(spec.estimated_time)},"
            "\n    null::numeric,"
            f"\n    {sql_text_array(spec.tips)},"
            f"\n    {sql_string(row_status)}::public.content_status,"
            f"\n    {sql_string(seo_title)},"
            f"\n    {sql_string(description)},"
            f"\n    {published_at},"
            "\n    'pro',"
            f"\n    {sql_string(spec.card_description)},"
            f"\n    {sql_text_array(spec.checklist_items)},"
            "\n    true,"
            "\n    true,"
            "\n    null::uuid,"
            "\n    true,"
            f"\n    {sql_string(spec.keyword_target)},"
            "\n    'palmon-survival-docx-import',"
            "\n    'game_offer',"
            "\n    'Palmon: Survival',"
            "\n    'palmon-survival',"
            f"\n    {sql_string(spec.keyword_intent)},"
            "\n    null,"
            "\n    0.95,"
            "\n    false,"
            "\n    '[]'::jsonb,"
            "\n    '[]'::jsonb,"
            f"\n    {sql_jsonb(source_urls)},"
            f"\n    {sql_jsonb(claims)},"
            f"\n    {spec.publish_priority},"
            f"\n    {sql_string(row_status)},"
            f"\n    {sql_string(editor_notes)}"
            "\n  )"
        )

    values = ",\n  ".join(rows)
    return f"""-- Generated by scripts/build-palmon-guide-import.py.
-- Imports the four expanded Palmon: Survival DOCX drafts into the existing guide system.
-- {header_status_note}
-- Do not run this SQL without reviewing body_md, source_urls, claims_needing_verification,
-- route links, and offer-matching behavior.

with g as (
  select id
  from public.games
  where slug = 'palmon-survival'
  limit 1
),
guide_data (
  title,
  slug,
  excerpt,
  body_md,
  platform_filter,
  difficulty,
  estimated_time,
  max_payout_usd,
  tips,
  status,
  seo_title,
  seo_description,
  published_at,
  layout_style,
  key_takeaways,
  checklist_items,
  show_related_offers,
  show_related_guides,
  primary_offer_id,
  disable_auto_offer_matching,
  keyword_target,
  batch_name,
  guide_type,
  platform_name,
  keyword_cluster_id,
  keyword_intent,
  angle_type,
  content_uniqueness_score,
  needs_variation,
  parsed_tasks,
  internal_link_suggestions,
  source_urls,
  claims_needing_verification,
  publish_priority,
  content_status,
  editor_notes
) as (
  values
  {values}
)
insert into public.guides (
  game_id,
  title,
  slug,
  excerpt,
  body_md,
  platform_filter,
  difficulty,
  estimated_time,
  max_payout_usd,
  tips,
  status,
  seo_title,
  seo_description,
  published_at,
  layout_style,
  key_takeaways,
  checklist_items,
  show_related_offers,
  show_related_guides,
  primary_offer_id,
  disable_auto_offer_matching,
  keyword_target,
  batch_name,
  guide_type,
  platform_name,
  keyword_cluster_id,
  keyword_intent,
  angle_type,
  content_uniqueness_score,
  needs_variation,
  parsed_tasks,
  internal_link_suggestions,
  source_urls,
  claims_needing_verification,
  publish_priority,
  content_status,
  editor_notes
)
select
  g.id,
  guide_data.*
from guide_data
cross join g
on conflict (slug) do update set
  game_id = excluded.game_id,
  title = excluded.title,
  excerpt = excluded.excerpt,
  body_md = excluded.body_md,
  platform_filter = excluded.platform_filter,
  difficulty = excluded.difficulty,
  estimated_time = excluded.estimated_time,
  max_payout_usd = excluded.max_payout_usd,
  tips = excluded.tips,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  {published_at_update}
  layout_style = excluded.layout_style,
  key_takeaways = excluded.key_takeaways,
  checklist_items = excluded.checklist_items,
  show_related_offers = excluded.show_related_offers,
  show_related_guides = excluded.show_related_guides,
  primary_offer_id = excluded.primary_offer_id,
  disable_auto_offer_matching = excluded.disable_auto_offer_matching,
  keyword_target = excluded.keyword_target,
  batch_name = excluded.batch_name,
  guide_type = excluded.guide_type,
  platform_name = excluded.platform_name,
  keyword_cluster_id = excluded.keyword_cluster_id,
  keyword_intent = excluded.keyword_intent,
  angle_type = excluded.angle_type,
  content_uniqueness_score = excluded.content_uniqueness_score,
  needs_variation = excluded.needs_variation,
  parsed_tasks = excluded.parsed_tasks,
  internal_link_suggestions = excluded.internal_link_suggestions,
  source_urls = excluded.source_urls,
  claims_needing_verification = excluded.claims_needing_verification,
  publish_priority = excluded.publish_priority,
  content_status = excluded.content_status,
  editor_notes = excluded.editor_notes;
"""


def main() -> None:
    args = parse_args()
    docx_dir = resolve_docx_dir(args.docx_dir)
    out_sql = Path(args.out).expanduser()
    if not out_sql.is_absolute():
        out_sql = ROOT / out_sql
    out_sql.parent.mkdir(parents=True, exist_ok=True)
    out_sql.write_text(build_sql(docx_dir, args.status), encoding="utf-8", newline="\n")
    print(f"Wrote {out_sql}")


if __name__ == "__main__":
    main()
