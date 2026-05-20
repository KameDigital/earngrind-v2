import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earn Users | EarnGrind Admin" };

type EarnUserProfileRow = {
    user_id: string;
    display_name: string | null;
    country: string | null;
    reward_status: string;
    review_status: string;
    review_reasons: string[] | null;
    last_reward_activity_at: string | null;
    created_at: string;
};

export default async function EarnUsersAdminPage() {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");

    const db = createAdminClient();
    const [{ data, error }, usersResult] = await Promise.all([
        db
            .from("earn_user_profiles")
            .select(`
                user_id,
                display_name,
                country,
                reward_status,
                review_status,
                review_reasons,
                last_reward_activity_at,
                created_at
            `)
            .order("created_at", { ascending: false })
            .limit(100),
        db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (error) {
        console.error("[admin/earn-users] profile query failed", error);
    }
    if (usersResult.error) {
        console.error("[admin/earn-users] auth user lookup failed", {
            message: usersResult.error.message,
        });
    }

    const rows = (data ?? []) as EarnUserProfileRow[];
    const emailByUserId = new Map((usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? null]));
    const active = rows.filter((row) => row.reward_status === "active").length;
    const restricted = rows.filter((row) => row.reward_status !== "active").length;
    const flagged = rows.filter((row) => row.review_status === "flagged" || row.review_status === "under_review").length;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Tracked Rewards"
                title="Earn users"
                description="Read-only reward profile and risk status layer for EarnGrind earning users."
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                CPAlead GET postbacks include password in the request URL. App payloads are redacted, but infrastructure logs may capture query strings. Review hosting/proxy logs or ask CPAlead about POST/header/IP-only alternatives before real traffic.
            </div>

            <section className="grid gap-3 sm:grid-cols-3">
                <AdminStatCard label="Profiles" value={rows.length} description="Users with an EarnGrind rewards profile." />
                <AdminStatCard label="Active" value={active} tone={active > 0 ? "good" : "neutral"} />
                <AdminStatCard label="Restricted/review" value={restricted + flagged} tone={restricted + flagged > 0 ? "warning" : "neutral"} />
            </section>

            <AdminPanel title="Reward user profiles" description="Phase 1 profile page is read-only. Status changes should remain deliberate admin operations.">
                {error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        Failed to load reward user profiles.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">User</th>
                                    <th className="px-3 py-2">Display</th>
                                    <th className="px-3 py-2">Country</th>
                                    <th className="px-3 py-2">Reward status</th>
                                    <th className="px-3 py-2">Review</th>
                                    <th className="px-3 py-2">Last activity</th>
                                    <th className="px-3 py-2">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => (
                                    <tr key={row.user_id} className="align-top">
                                        <td className="px-3 py-3">
                                            <div className="font-mono text-xs text-gray-500">{row.user_id}</div>
                                            <div className="mt-1 text-xs text-gray-600">{emailByUserId.get(row.user_id) ?? "Email unavailable"}</div>
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-gray-900">{row.display_name || "-"}</td>
                                        <td className="px-3 py-3 text-gray-600">{row.country || "-"}</td>
                                        <td className="px-3 py-3">{statusBadge(row.reward_status)}</td>
                                        <td className="px-3 py-3">
                                            {reviewBadge(row.review_status)}
                                            {row.review_reasons?.length ? (
                                                <div className="mt-2 max-w-xs text-xs font-semibold text-amber-700">
                                                    {row.review_reasons.join(", ")}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{formatDateTime(row.last_reward_activity_at)}</td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{formatDateTime(row.created_at)}</td>
                                    </tr>
                                ))}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-6 text-gray-500" colSpan={7}>No reward user profiles yet.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminPanel>
        </div>
    );
}

function statusBadge(status: string) {
    const classes = status === "active"
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : status === "limited"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-red-200 bg-red-50 text-red-800";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{status}</span>;
}

function reviewBadge(status: string) {
    const classes = status === "clean" || status === "cleared"
        ? "border-lime-200 bg-lime-50 text-lime-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

    return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${classes}`}>{status.replaceAll("_", " ")}</span>;
}

function formatDateTime(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
