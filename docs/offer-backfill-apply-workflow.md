# Offer Backfill Apply Workflow

Use these scripts in small reviewed batches. They are dry-run by default and only write when `--apply` is passed.

## Thumbnail Backfill

Preview:

```bash
node scripts/backfill-game-thumbnails-from-offers.mjs --dry-run --limit 250 --write-report reports/game-thumbnail-backfill-preview.json --write-report-csv reports/game-thumbnail-backfill-preview.csv
```

Apply a small batch:

```bash
node scripts/backfill-game-thumbnails-from-offers.mjs --apply --limit 100
node scripts/audit-offer-data-quality.mjs --json --min-payout 0.05
```

Start with small batches and inspect `/games` after each apply.

## Task Backfill

Preview:

```bash
node scripts/backfill-taskless-site-offers.mjs --platform Gemsloot --dry-run --limit 100 --write-report reports/gemsloot-task-backfill-preview.json --write-report-csv reports/gemsloot-task-backfill-preview.csv
```

Apply a small high-confidence batch:

```bash
node scripts/backfill-taskless-site-offers.mjs --platform Gemsloot --apply --limit 50 --min-confidence high
node scripts/audit-offer-data-quality.mjs --json --min-payout 0.05
```

Do not apply all taskless offers at once. Apply mode defaults to high/medium confidence only unless `--include-low-confidence` is passed.

## Before/After Audit

```bash
node scripts/audit-offer-data-quality.mjs --json --write-report reports/audit-before.json
# apply one small batch
node scripts/audit-offer-data-quality.mjs --json --write-report reports/audit-after.json
node scripts/compare-offer-audit-reports.mjs reports/audit-before.json reports/audit-after.json
```

Compare active taskless offers, games missing thumbnails, thumbnail candidates, missing images, and public low-payout rows.

## Browser Smoke Check

After any thumbnail apply batch, check:

- `/games`
- one game page with a newly backfilled thumbnail
- one offer comparison page
- mobile width

Look for broken image icons, stretched images, layout shift, slow image loading, and poor placeholder replacements.
