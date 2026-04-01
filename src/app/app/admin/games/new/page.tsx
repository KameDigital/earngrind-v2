import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GameCreateForm from "./GameCreateForm";

export const metadata = { title: "New Game — Admin" };

export default async function NewGamePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    return (
        <div className="max-w-2xl space-y-6">
            <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/app/admin/games" className="hover:text-gray-700 transition font-medium">← Games</Link>
                <span>/</span>
                <span className="text-gray-600">New Game</span>
            </nav>

            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">New Game</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Add a game to the catalog. Create this before adding offers or guides.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <GameCreateForm />
            </div>
        </div>
    );
}
