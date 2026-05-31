# Publish QA report: State of Survival Zombie War Torox guide

Result: BLOCKED

Date: 2026-05-30

Route: `http://localhost:3010/guides/state-of-survival-zombie-war-torox-guide`

## Blocker

Publish QA cannot pass yet. A rendered static route has been added in code, but the local Next app cannot start because the worktree already contains an unrelated `src/app/sitemap.xml/` route that conflicts with the metadata sitemap route:

`You cannot define a route with the same specificity as a optional catch-all route ("/sitemap.xml" and "/sitemap.xml[[...__metadata_id__]]").`

The Markdown content artifact passed content QA, and the route implementation linted/typechecked. The actual page still needs browser route, metadata, link, layout, sitemap, and content-parity checks after the unrelated sitemap route conflict is resolved.

## Checks

| Check | Result | Notes |
| --- | --- | --- |
| route_200 | BLOCKED | Local app startup is blocked by the unrelated sitemap.xml route conflict. |
| no_noindex | BLOCKED | Cannot inspect robots metadata until the app starts. |
| canonical | BLOCKED | Cannot inspect canonical URL until the app starts. |
| one_h1 | BLOCKED | Cannot inspect rendered H1 count until the app starts. |
| title_meta | BLOCKED | Cannot inspect rendered title/meta until the app starts. |
| schema | BLOCKED | Cannot inspect structured data until the app starts. |
| internal_links | BLOCKED | Cannot verify internal links until the app starts. |
| cta_links | BLOCKED | Cannot verify CTA links until the app starts. |
| images | BLOCKED | Cannot verify images or alt text until the app starts. |
| mobile_overflow | BLOCKED | Cannot run mobile overflow checks until the app starts. |
| sitemap | BLOCKED | Route is included in STATIC_GUIDES for sitemap output, but rendered sitemap verification is blocked. |
| empty_offer_state | BLOCKED | Static route has no offer-state fetch, but rendered verification is blocked. |
| content_parity | BLOCKED | Cannot compare rendered page to index.md until the app starts. |
| section_navigation | BLOCKED | Cannot verify visible section navigation until the app starts. |
| readable_rendered_structure | BLOCKED | Cannot inspect rendered structure until the app starts. |
| game_detail_sections | BLOCKED | Cannot verify rendered game detail sections until the app starts. |

## Required blocker

Resolve the unrelated `src/app/sitemap.xml/` route conflict, then rerun browser publish QA against `http://localhost:3010/guides/state-of-survival-zombie-war-torox-guide`.
