import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import GameEditForm from "./GameEditForm";

export const metadata = { title: "Edit Game — Admin" };

export default async function EditGamePage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: game } = await supabase
        .from("games")
        .select("id, name, slug, category, devices, aliases, thumbnail_url, description")
        .eq("id", params.id)
        .single();

    if (!game) notFound();

    return (
        <div className="max-w-2xl space-y-6">
            <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/app/admin/games" className="hover:text-gray-700 transition font-medium">← Games</Link>
                <span>/</span>
                <span className="text-gray-600">{game.name}</span>
            </nav>

            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Game</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Editing <span className="font-mono text-gray-700">{game.slug}</span>
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <GameEditForm game={{
                    id:            game.id,
                    name:          game.name,
                    slug:          game.slug,
                    category:      game.category    ?? null,
                    devices:       game.devices     ?? [],
                    aliases:       game.aliases     ?? [],
                    thumbnail_url: game.thumbnail_url ?? null,
                    description:   game.description ?? null,
                }} />
            </div>
        </div>
    );
}
