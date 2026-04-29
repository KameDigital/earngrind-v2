import { logout } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNav from './AdminNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    const isAdmin = ['admin', 'editor'].includes(profile?.role ?? '');

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* ── Top bar ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
                        {/* Left: wordmark + nav (client component for active links) */}
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                            <Link
                                href="/app/dashboard"
                                className="font-extrabold text-gray-900 tracking-tight text-sm flex items-center gap-2 flex-shrink-0"
                            >
                                <span className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center text-xs text-white font-black">
                                    E
                                </span>
                                Earngrind
                            </Link>
                            <div className="min-w-0 flex-1">
                                <AdminNav isAdmin={isAdmin} />
                            </div>
                        </div>

                        {/* Right: email + sign out */}
                        <div className="ml-auto flex min-w-0 flex-shrink items-center justify-end gap-2">
                            <span className="hidden max-w-[120px] truncate text-xs text-gray-400 lg:block xl:max-w-[180px]" title={user.email ?? ""}>
                                {user.email}
                            </span>
                            <form action={logout}>
                                <button className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600">
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Page content ── */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}
