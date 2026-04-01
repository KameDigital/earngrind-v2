import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Account Settings | Earngrind' };

export default async function AccountPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="space-y-6 max-w-2xl">
            {/* ── Page header ── */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
            </div>

            {/* ── Profile card ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                <div className="p-5">
                    <h2 className="text-sm font-bold text-gray-800 mb-4">Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    disabled
                                    value={user?.email ?? ''}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                                />
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
                                    Read-only
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                                Email is managed through your auth provider.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Placeholder future cards ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 opacity-60">
                <h2 className="text-sm font-bold text-gray-400 mb-2">Password & Security</h2>
                <p className="text-xs text-gray-400">Password management coming soon.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 opacity-60">
                <h2 className="text-sm font-bold text-gray-400 mb-2">Notifications</h2>
                <p className="text-xs text-gray-400">Notification preference settings coming soon.</p>
            </div>
        </div>
    );
}
