import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { Client } = pg;
const CLI = process.env.SUPABASE_BIN ?? "supabase";
const tables = ["user_offer_favorites", "user_offer_views", "user_offer_tracking"];
const createdUserIds = [];

function localEnv() {
  const output = execFileSync(CLI, ["status", "--workdir", ".", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(output.split(/\r?\n/).map((line) => line.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(([, key, value]) => [key, value.replace(/^"|"$/g, "")]));
  for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "DB_URL"]) assert.ok(env[key], `local Supabase ${key} is required`);
  return env;
}

function id(index) { return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`; }
function offer(index, overrides = {}) {
  return { user_id: overrides.user_id, offer_source: overrides.offer_source ?? "manual", offer_id: overrides.offer_id ?? id(index), title: overrides.title ?? `Fixture offer ${index}`, image_url: "https://images.example.test/offer.png", payout_usd: 5, platform_name: "Fixture platform", country_code: "US", devices: ["web"], offer_path: `/offers/fixture-${index}`, ...overrides };
}
function assertNoRows(result, label) { assert.equal(result.error, null, `${label}: unexpected API error`); assert.equal(result.data?.length ?? 0, 0, `${label}: must not affect a row`); }
function assertDeniedOrNoRows(result, label) { assert.ok(result.error || (result.data?.length ?? 0) === 0, `${label}: must be denied or return no rows`); }
async function signedIn(url, anonKey, email, password) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  assert.equal(error, null, `local sign-in failed`);
  return client;
}

const env = localEnv();
const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(env.API_URL, env.ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const password = `Local-${crypto.randomBytes(18).toString("base64url")}!`;

async function createUser(label) {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(error, null, `create local ${label} failed`);
  assert.ok(data.user?.id, `local ${label} id missing`);
  createdUserIds.push(data.user.id);
  return { id: data.user.id, client: await signedIn(env.API_URL, env.ANON_KEY, email, password) };
}

const db = new Client({ connectionString: env.DB_URL });
try {
  await db.connect();
  const schema = await db.query(`
    select c.relname, c.relrowsecurity, c.relforcerowsecurity,
      (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policy_count,
      has_table_privilege('anon', format('public.%I', c.relname), 'select') as anon_select
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname = any($1::text[])`, [tables]);
  assert.equal(schema.rowCount, 3, "all dashboard tables must exist");
  for (const row of schema.rows) {
    assert.equal(row.relrowsecurity, true, `${row.relname} must have RLS enabled`);
    assert.equal(row.policy_count, "1", `${row.relname} must have its self-only policy`);
    assert.equal(row.anon_select, false, `${row.relname} must not grant anon SELECT`);
  }
  const constraints = await db.query(`
    select conrelid::regclass::text as table_name, contype, confdeltype
    from pg_constraint
    where conrelid = any($1::regclass[])`, [tables.map((table) => `public.${table}`)]);
  for (const table of tables) {
    const own = constraints.rows.filter((row) => row.table_name === table || row.table_name === `public.${table}`);
    assert.ok(own.some((row) => row.contype === "p"), `${table} primary key missing`);
    assert.ok(own.some((row) => row.contype === "u"), `${table} canonical unique constraint missing`);
    assert.ok(own.some((row) => row.contype === "f" && row.confdeltype === "c"), `${table} auth-user cascade missing`);
  }
  const indexes = await db.query(`select tablename, indexname from pg_indexes where schemaname='public' and tablename = any($1::text[])`, [tables]);
  for (const table of tables) assert.ok(indexes.rows.some((row) => row.tablename === table && row.indexname.includes("_user_")), `${table} user ordering index missing`);
  const fn = await db.query(`select prosecdef, coalesce(array_to_string(proconfig, ','), '') as config from pg_proc where pronamespace='public'::regnamespace and proname='trim_my_offer_view_history'`);
  assert.equal(fn.rowCount, 1, "retention function missing");
  assert.equal(fn.rows[0].prosecdef, false, "retention function must be security invoker");
  assert.match(fn.rows[0].config, /search_path=public, pg_temp/, "retention function must pin search_path");

  for (const table of tables) {
    const select = await anonymous.from(table).select("*");
    assertDeniedOrNoRows(select, `anonymous ${table} select`);
    const insert = await anonymous.from(table).insert(offer(10));
    assert.ok(insert.error, `anonymous ${table} insert must be denied`);
    const update = await anonymous.from(table).update({ title: "blocked" }).eq("id", id(999));
    assert.ok(update.error || update.data == null, `anonymous ${table} update must be denied`);
    const remove = await anonymous.from(table).delete().eq("id", id(999)).select();
    assertDeniedOrNoRows(remove, `anonymous ${table} delete`);
  }

  const a = await createUser("dashboard-user-a");
  const b = await createUser("dashboard-user-b");
  const favoriteA = offer(1, { user_id: a.id });
  const favoriteB = offer(2, { user_id: b.id });
  assert.equal((await a.client.from("user_offer_favorites").insert(favoriteA).select()).error, null, "User A favorite insert");
  assert.equal((await b.client.from("user_offer_favorites").insert(favoriteB).select()).error, null, "User B favorite insert");
  assert.equal((await a.client.from("user_offer_favorites").upsert(favoriteA, { onConflict: "user_id,offer_source,offer_id" })).error, null, "favorite upsert must be idempotent");
  const duplicateFavorite = await a.client.from("user_offer_favorites").select("id", { count: "exact" }).eq("offer_id", favoriteA.offer_id);
  assert.equal(duplicateFavorite.count, 1, "duplicate favorite must not create another row");
  const forged = await a.client.from("user_offer_favorites").insert(offer(3, { user_id: b.id }));
  assert.ok(forged.error, "User A must not forge User B ownership");
  for (const [index, offer_path] of [[501, "https://evil.example/offer"], [502, "//evil.example/offer"], [503, "/offers/fixture?next=//evil.example"]]) {
    const unsafe = await a.client.from("user_offer_favorites").insert(offer(index, { user_id: a.id, offer_path }));
    assert.ok(unsafe.error, `unsafe saved route ${offer_path} must be rejected`);
  }
  const bFavorite = (await service.from("user_offer_favorites").select("id").eq("user_id", b.id).single()).data;
  assert.ok(bFavorite?.id, "User B fixture missing");
  assertNoRows(await a.client.from("user_offer_favorites").select("id").eq("id", bFavorite.id), "User A read User B favorite");
  assertNoRows(await a.client.from("user_offer_favorites").update({ title: "blocked" }).eq("id", bFavorite.id).select(), "User A update User B favorite");
  assertNoRows(await a.client.from("user_offer_favorites").delete().eq("id", bFavorite.id).select(), "User A delete User B favorite");

  const tracking = offer(4, { user_id: a.id });
  assert.equal((await a.client.from("user_offer_tracking").upsert(tracking, { onConflict: "user_id,offer_source,offer_id" })).error, null, "User A tracking upsert");
  assert.equal((await a.client.from("user_offer_tracking").upsert(tracking, { onConflict: "user_id,offer_source,offer_id" })).error, null, "tracking repeat must be idempotent");
  assert.equal((await a.client.from("user_offer_tracking").select("id", { count: "exact" }).eq("offer_id", tracking.offer_id)).count, 1, "duplicate tracking must not create another row");

  for (let i = 1; i <= 55; i += 1) {
    const view = offer(100 + i, { user_id: a.id, last_viewed_at: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString() });
    assert.equal((await a.client.from("user_offer_views").upsert(view, { onConflict: "user_id,offer_source,offer_id" })).error, null, `view ${i} upsert`);
  }
  assert.equal((await a.client.rpc("trim_my_offer_view_history")).error, null, "view retention trim");
  const retained = await a.client.from("user_offer_views").select("offer_id,last_viewed_at").order("last_viewed_at", { ascending: false });
  assert.equal(retained.data?.length, 50, "only newest fifty views must remain");
  assert.equal(retained.data?.[0]?.offer_id, id(155), "newest view must be first");
  assert.equal(retained.data?.at(-1)?.offer_id, id(106), "five oldest views must be removed");
  const moved = offer(155, { user_id: a.id, last_viewed_at: new Date(Date.UTC(2026, 0, 2)).toISOString() });
  assert.equal((await a.client.from("user_offer_views").upsert(moved, { onConflict: "user_id,offer_source,offer_id" })).error, null, "existing view upsert");
  assert.equal((await a.client.rpc("trim_my_offer_view_history")).error, null, "repeat view retention trim");
  const afterMove = await a.client.from("user_offer_views").select("offer_id", { count: "exact" }).order("last_viewed_at", { ascending: false });
  assert.equal(afterMove.count, 50, "repeat view must not increase history count");
  assert.equal(afterMove.data?.[0]?.offer_id, id(155), "repeat view must move to newest position");
  const viewB = offer(300, { user_id: b.id });
  assert.equal((await b.client.from("user_offer_views").insert(viewB)).error, null, "User B view insert");
  assertNoRows(await a.client.from("user_offer_views").select("id").eq("user_id", b.id), "User A read User B views");

  const disposable = await createUser("dashboard-cascade");
  assert.equal((await disposable.client.from("user_offer_favorites").insert(offer(400, { user_id: disposable.id }))).error, null, "cascade fixture insert");
  assert.equal((await service.auth.admin.deleteUser(disposable.id)).error, null, "delete disposable auth user");
  createdUserIds.splice(createdUserIds.indexOf(disposable.id), 1);
  assert.equal((await service.from("user_offer_favorites").select("id", { count: "exact" }).eq("user_id", disposable.id)).count, 0, "Auth-user deletion must cascade");

  console.log("Local dashboard integration passed: schema, Auth JWT RLS, cross-user isolation, idempotency, retention, and cascade.");
} finally {
  for (const userId of createdUserIds.reverse()) await service.auth.admin.deleteUser(userId).catch(() => undefined);
  await db.end().catch(() => undefined);
}