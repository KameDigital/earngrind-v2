import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'Admin Dashboard | Earngrind' };

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    const isAdmin = ['admin', 'editor'].includes(profile?.role ?? '');

    // Fetch counts in parallel (only for admins)
    let gameCount = 0, offerCount = 0, siteOfferCount = 0, activeOfferCount = 0;

    if (isAdmin) {
        const [gRes, oRes, soRes, aoRes] = await Promise.all([
            supabase.from('games').select('id', { count: 'exact', head: true }),
            supabase.from('offers').select('id', { count: 'exact', head: true }),
            supabase.from('site_offers').select('id', { count: 'exact', head: true }),
            supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);
        gameCount        = gRes.count  ?? 0;
        offerCount       = oRes.count  ?? 0;
        siteOfferCount   = soRes.count ?? 0;
        activeOfferCount = aoRes.count ?? 0;
    }

    return (
        <div className="space-y-8">
            {/* ── Page header ── */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Overview of the Earngrind admin system</p>
            </div>

            {/* ── Admin stats ── */}
            {isAdmin && (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">System Overview</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard label="Games" value={gameCount} icon="🎮" href="/app/admin/games" />
                        <StatCard label="Ingested Offers" value={offerCount} icon="📥" href="/app/admin/offers" />
                        <StatCard label="Manual Offers" value={siteOfferCount} icon="✏️" href="/app/admin/site-offers" />
                        <StatCard label="Active Offers" value={activeOfferCount} icon="✅" accent />
                    </div>
                </div>
            )}

            {/* ── Quick actions ── */}
            {isAdmin && (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <QuickAction href="/app/admin/games/new"       label="Add Game"         icon="🎮" />
                        <QuickAction href="/app/admin/site-offers/new" label="Add Manual Offer" icon="✏️" primary />
                        <QuickAction href="/app/admin/offers"          label="View Offers"      icon="📥" />
                    </div>
                </div>
            )}

            {/* ── System explainer ── */}
            {isAdmin && (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">How it works</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ExplainerCard
                            icon="🎮"
                            title="Games"
                            desc="The base entity. Every offer and guide is linked to a game. Create a game first before adding offers."
                            href="/app/admin/games"
                            linkLabel="Manage Games"
                        />
                        <ExplainerCard
                            icon="📥"
                            title="Ingested Offers"
                            desc="Automatically pulled from external platforms via the ingestion pipeline. You can edit payouts, status, and flags — but not create new ones."
                            href="/app/admin/offers"
                            linkLabel="View Offers"
                        />
                        <ExplainerCard
                            icon="✏️"
                            title="Manual Offers"
                            desc='Hand-curated offers that appear in the "Compare GPT Sites" section on game pages. You control every field and task.'
                            href="/app/admin/site-offers"
                            linkLabel="Manage Manual Offers"
                        />
                    </div>
                </div>
            )}

            {/* ── Non-admin welcome ── */}
            {!isAdmin && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Earngrind</h2>
                    <p className="text-sm text-gray-500">
                        You&apos;re signed in as <span className="font-medium text-gray-800">{user.email}</span>.
                        Admin tools are available to editors and admins.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
    label, value, icon, href, accent,
}: {
    label: string; value: number; icon: string; href?: string; accent?: boolean;
}) {
    const inner = (
        <>
            <div className="text-xl">{icon}</div>
            <div className={`text-2xl font-extrabold ${accent ? 'text-white' : 'text-gray-900'}`}>
                {value.toLocaleString()}
            </div>
            <div className={`text-xs font-medium ${accent ? 'text-gray-300' : 'text-gray-500'}`}>{label}</div>
        </>
    );

    const className = `rounded-xl border p-4 flex flex-col gap-1 transition-all ${
        accent
            ? 'bg-gray-900 border-gray-800 text-white'
            : 'bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
    } ${href ? 'cursor-pointer' : ''}`;

    if (href) {
        return <Link href={href} className={className}>{inner}</Link>;
    }
    return <div className={className}>{inner}</div>;
}

function QuickAction({ href, label, icon, primary }: {
    href: string; label: string; icon: string; primary?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:-translate-y-px ${
                primary
                    ? 'bg-gray-900 text-white border-gray-800 shadow-sm hover:bg-gray-800'
                    : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:border-gray-300 hover:text-gray-900'
            }`}
        >
            <span>{icon}</span>
            {label}
        </Link>
    );
}

function ExplainerCard({ icon, title, desc, href, linkLabel }: {
    icon: string; title: string; desc: string; href: string; linkLabel: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-3">
            <div className="text-2xl">{icon}</div>
            <div>
                <div className="font-bold text-gray-900 text-sm mb-1">{title}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
            <Link
                href={href}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-auto"
            >
                {linkLabel} →
            </Link>
        </div>
    );
}
