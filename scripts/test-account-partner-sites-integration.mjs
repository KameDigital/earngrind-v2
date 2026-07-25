import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const output = execFileSync(process.env.SUPABASE_BIN ?? "supabase", ["status", "--workdir", ".", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const env = Object.fromEntries(output.split(/\r?\n/).map((line) => line.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(([, key, value]) => [key, value.replace(/^"|"$/g, "")]));
for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "DB_URL"]) assert.ok(env[key], `local Supabase ${key} is required`);
const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(env.API_URL, env.ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const password = `Partner-${crypto.randomBytes(18).toString("base64url")}!`;
const users = [];

async function user(label) {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null, `create ${label}`);
  const id = created.data.user?.id;
  assert.ok(id, `${label} id`);
  users.push(id);
  const client = createClient(env.API_URL, env.ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  assert.equal((await client.auth.signInWithPassword({ email, password })).error, null, `sign in ${label}`);
  return { id, client };
}

try {
  const database = new pg.Client({ connectionString: env.DB_URL });
  await database.connect();
  const platform = await database.query("select id from public.platforms where platform_kind = 'gpt_site' and is_active = true limit 1");
  await database.end();
  assert.ok(platform.rows[0]?.id, "active GPT platform fixture required");
  const platformId = platform.rows[0].id;
  const a = await user("partner-a");
  const b = await user("partner-b");
  assert.ok((await anonymous.from("user_gpt_partner_accounts").select("id")).error, "anonymous partner read denied");
  assert.ok((await anonymous.from("user_gpt_partner_accounts").insert({ user_id: a.id, platform_id: platformId })).error, "anonymous partner insert denied");
  const row = { user_id: a.id, platform_id: platformId, last_signup_click_at: new Date().toISOString() };
  assert.equal((await a.client.from("user_gpt_partner_accounts").upsert(row, { onConflict: "user_id,platform_id" })).error, null, "User A partner open");
  assert.equal((await a.client.from("user_gpt_partner_accounts").upsert({ ...row, last_signup_click_at: new Date(Date.now() + 1000).toISOString() }, { onConflict: "user_id,platform_id" })).error, null, "repeated partner open");
  const own = await a.client.from("user_gpt_partner_accounts").select("id", { count: "exact" }).eq("platform_id", platformId);
  assert.equal(own.count, 1, "repeated opens remain one private connection");
  assert.ok((await a.client.from("user_gpt_partner_accounts").insert({ user_id: b.id, platform_id: platformId })).error, "User A cannot forge User B connection");
  assert.equal((await b.client.from("user_gpt_partner_accounts").upsert({ user_id: b.id, platform_id: platformId }, { onConflict: "user_id,platform_id" })).error, null, "User B connection");
  const bRow = await b.client.from("user_gpt_partner_accounts").select("id").single();
  assert.ok(bRow.data?.id, "User B connection exists");
  const cross = await a.client.from("user_gpt_partner_accounts").select("id").eq("id", bRow.data.id);
  assert.equal(cross.data?.length ?? 0, 0, "User A cannot read User B connection");
  assert.equal((await service.auth.admin.deleteUser(a.id)).error, null, "delete disposable User A");
  users.splice(users.indexOf(a.id), 1);
  console.log("Account partner integration passed: anonymous denial, A/B isolation, idempotent link opens, and Auth-user cascade.");
} finally {
  for (const id of users.reverse()) await service.auth.admin.deleteUser(id).catch(() => undefined);
}
