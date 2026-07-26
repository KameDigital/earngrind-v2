import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const bin = process.env.SUPABASE_BIN ?? "C:/Users/kamed/scoop/shims/supabase.exe";
const output = execFileSync(bin, ["status", "--workdir", ".", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const env = Object.fromEntries(output.split(/\r?\n/).map((line) => line.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(([, key, value]) => [key, value.replace(/^"|"$/g, "")]));
for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"]) assert.ok(env[key], `local Supabase ${key} is required`);

const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const observer = createClient(env.API_URL, env.ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const sender = createClient(env.API_URL, env.ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const password = `Realtime-${crypto.randomBytes(18).toString("base64url")}!`;
let userId;
let channel;

async function waitFor(predicate, message) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

try {
  const created = await service.auth.admin.createUser({ email: `chat-realtime-${crypto.randomUUID()}@example.test`, password, email_confirm: true });
  assert.equal(created.error, null, "create disposable realtime user");
  userId = created.data.user.id;
  assert.equal((await sender.auth.signInWithPassword({ email: created.data.user.email, password })).error, null, "authenticate disposable realtime user");

  const events = [];
  let joined = false;
  channel = observer
    .channel("community-chat")
    .on("broadcast", { event: "chat_changed" }, (event) => events.push(event))
    .subscribe((status) => { if (status === "SUBSCRIBED") joined = true; });
  await waitFor(() => joined, "public chat Broadcast subscription did not join");

  const sent = await sender.rpc("send_community_chat_message", { p_body: "realtime regression probe", p_client_message_id: crypto.randomUUID() });
  assert.equal(sent.error, null, "send realtime probe");
  await waitFor(() => events.length === 1, "insert did not broadcast");
  assert.equal(events[0].payload.message_id, sent.data.id, "insert broadcast identifies the changed message"); assert.equal(events[0].payload.operation, "INSERT", "insert broadcast identifies the operation"); assert.equal(typeof events[0].payload.id, "string", "broadcast has an opaque event ID"); assert.equal("user_id" in events[0].payload || "body" in events[0].payload, false, "insert broadcast omits private message fields");

  const removed = await sender.rpc("delete_community_chat_message", { p_message_id: sent.data.id });
  assert.equal(removed.error, null, "delete realtime probe");
  await waitFor(() => events.length === 2, "deletion did not broadcast");
  assert.equal(events[1].payload.message_id, sent.data.id, "deletion broadcast identifies the changed message"); assert.equal(events[1].payload.operation, "UPDATE", "deletion broadcast identifies the operation"); assert.equal("user_id" in events[1].payload || "body" in events[1].payload, false, "deletion broadcast omits private message fields");
  console.log("Community chat Realtime Broadcast passed: public insert and deletion invalidation events.");
} finally {
  if (channel) await observer.removeChannel(channel).catch(() => undefined);
  if (userId) await service.auth.admin.deleteUser(userId).catch(() => undefined);
}