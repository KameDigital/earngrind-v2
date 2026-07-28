import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
function decodeCursor(value: string | null): { createdAt: string; id: string } | null { if (!value) return null; try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")); if (parsed?.v !== 1 || typeof parsed.createdAt !== "string" || typeof parsed.id !== "string" || Number.isNaN(Date.parse(parsed.createdAt)) || !/^[0-9a-f-]{36}$/i.test(parsed.id)) return null; return { createdAt: parsed.createdAt, id: parsed.id }; } catch { return null; } }
function encodeCursor(message: { created_at: string; id: string }) { return Buffer.from(JSON.stringify({ v: 1, createdAt: message.created_at, id: message.id })).toString("base64url"); }
export async function GET(request: NextRequest) {
  const cursorValue = request.nextUrl.searchParams.get("cursor"); const cursor = decodeCursor(cursorValue); if (cursorValue && !cursor) return NextResponse.json({ error: "Invalid cursor." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const parsedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "50"); const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); const { data, error } = await supabase.rpc("list_community_chat_messages", { p_before: cursor?.createdAt ?? null, p_before_id: cursor?.id ?? null, p_limit: limit + 1 });
  if (error) return NextResponse.json({ error: "Chat is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); const rows = data ?? []; const hasMore = rows.length > limit; const messages = hasMore ? rows.slice(0, limit) : rows; const last = messages[messages.length - 1]; return NextResponse.json({ messages, has_more: hasMore, next_cursor: hasMore && last ? encodeCursor(last) : null, can_post: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
}export async function POST(request: NextRequest) {
  const parsed = await request.json().catch(() => null); if (!parsed || typeof parsed.body !== "string" || typeof parsed.clientMessageId !== "string") return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Sign in to post." }, { status: 401 });
  const { data, error } = await supabase.rpc("send_community_chat_message", { p_body: parsed.body, p_client_message_id: parsed.clientMessageId });
  if (error) return NextResponse.json({ error: error.message === "Authentication required" ? "Sign in to post." : error.message }, { status: error.code === "42901" ? 429 : 400 });
  return NextResponse.json({ message: { id: data.id } });
}
export async function DELETE(request: NextRequest) {
  const parsed = await request.json().catch(() => null); if (!parsed || typeof parsed.id !== "string") return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Sign in to moderate." }, { status: 401 });
  const { error } = await supabase.rpc("delete_community_chat_message", { p_message_id: parsed.id }); if (error) return NextResponse.json({ error: "Message not found or not permitted." }, { status: 403 }); return new NextResponse(null, { status: 204 });
}