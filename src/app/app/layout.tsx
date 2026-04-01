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
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* Left: wordmark + nav (client component for active links) */}
                        <div className="flex items-center gap-5 min-w-0">
                            <Link
                                href="/app/dashboard"
                                className="font-extrabold text-gray-900 tracking-tight text-sm flex items-center gap-2 flex-shrink-0"
                            >
                                <span className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center text-xs text-white font-black">
                                    E
                                </span>
                                Earngrind
                            </Link>
                            <AdminNav isAdmin={isAdmin} />
                        </div>

                        {/* Right: email + sign out */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-gray-400 hidden md:block truncate max-w-[180px]">
                                {user.email}
                            </span>
                            <form action={logout}>
                                <button className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50">
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
