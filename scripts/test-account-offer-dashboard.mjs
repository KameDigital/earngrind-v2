import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");
const migration = read("supabase/migrations/20260718120000_add_user_offer_dashboard.sql");
const actions = read("src/app/account/offer-actions.ts");
const validation = read("src/lib/account-offers.ts");
const dashboard = read("src/app/account/page.tsx");
const controls = read("src/components/offers/OfferSaveControls.tsx");

for (const table of ["user_offer_favorites", "user_offer_views", "user_offer_tracking"]) {
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), `${table} must enable RLS`);
  assert.match(migration, new RegExp(`user_id uuid not null references auth\\.users\\(id\\) on delete cascade`), `${table} must cascade with the Auth user`);
}
assert.match(migration, /unique \(user_id, offer_source, offer_id\)/, "saved offer records must be unique per user and canonical offer");
assert.match(migration, /offset 50/, "recent views must be bounded to fifty records");
assert.match(migration, /auth\.uid\(\)\) = user_id/, "RLS must scope dashboard records to the current user");
assert.match(actions, /supabase\.auth\.getUser\(\)/, "actions must derive identity from the server session");
assert.match(actions, /onConflict: "user_id,offer_source,offer_id"/, "mutations must be idempotent upserts");
assert.match(validation, /Invalid offer path/, "saved offer paths must be validated server-side");
assert.match(validation, /Invalid image URL/, "snapshot image URLs must be validated server-side");
assert.match(dashboard, /force-dynamic/, "private account data must be dynamically rendered");
assert.match(dashboard, /count: "exact"/, "dashboard summary metrics must use exact totals rather than the six-card preview limit");
assert.match(controls, /\/login\?next=/, "signed-out save controls must use a safe internal login return path");
console.log("Account offer dashboard guard passed");
