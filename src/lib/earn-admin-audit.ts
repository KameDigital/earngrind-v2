import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type AuditTargetType = "earn_user_profile" | "conversion_event" | "user_reward_ledger";

type WriteEarnAdminAuditEventInput = {
  adminUserId: string;
  targetUserId?: string | null;
  targetType: AuditTargetType;
  targetId?: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export async function writeEarnAdminAuditEvent(
  db: SupabaseClient,
  input: WriteEarnAdminAuditEventInput,
) {
  const { error } = await db.from("earn_admin_audit_events").insert({
    admin_user_id: input.adminUserId,
    target_user_id: input.targetUserId ?? null,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    action: input.action,
    before: input.before,
    after: input.after,
  });

  if (error) {
    throw new Error(`Failed to write earn admin audit event: ${error.message}`);
  }
}
