import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BlogPostCreateForm from "./BlogPostCreateForm";

export const metadata = { title: "New Blog Post | Admin" };

export default async function NewBlogPostPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Link href="/app/admin/blog-posts" className="hover:text-gray-700 transition-colors">Blog Posts</Link>
                    <span>/</span>
                    <span className="text-gray-600 font-medium">New</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">New Blog Post</h1>
                <p className="text-sm text-gray-500 mt-1">Write a strategy article, earnings experiment, or platform update.</p>
            </div>
            <BlogPostCreateForm />
        </div>
    );
}
