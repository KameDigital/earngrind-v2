import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminNav from "./AdminNav";
import AdminSearch from "./AdminSearch";
import { noindexFollowRobots } from "@/lib/seo-metadata";

export const metadata: Metadata = {
    robots: noindexFollowRobots(),
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    const isAdmin = ["admin", "editor"].includes(profile?.role ?? "");

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
                <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6">
                    <Link
                        href={isAdmin ? "/app/admin" : "/app/dashboard"}
                        className="flex shrink-0 items-center gap-2 text-sm font-extrabold tracking-tight text-gray-950"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-950 text-xs font-black text-white">
                            E
                        </span>
                        EarnGrind
                    </Link>

                    <div className="min-w-0 flex-1 lg:hidden">
                        <AdminNav isAdmin={isAdmin} />
                    </div>

                    {isAdmin ? <AdminSearch /> : null}

                    <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2">
                        <span className="hidden max-w-[120px] truncate text-xs text-gray-400 lg:block xl:max-w-[220px]" title={user.email ?? ""}>
                            {user.email}
                        </span>
                        <form action={logout}>
                            <button className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600">
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <div className="flex min-h-[calc(100vh-3.5rem)]">
                {isAdmin ? <AdminNav isAdmin={isAdmin} /> : null}
                <main className="min-w-0 flex-1">
                    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
