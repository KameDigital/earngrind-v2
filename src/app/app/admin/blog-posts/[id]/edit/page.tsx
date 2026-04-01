import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import BlogPostEditForm from "./BlogPostEditForm";

export const metadata = { title: "Edit Blog Post | Admin" };

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const { data: post } = await supabase.from("blog_posts").select("*").eq("id", params.id).single();
    if (!post) notFound();

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Link href="/app/admin/blog-posts" className="hover:text-gray-700 transition-colors">Blog Posts</Link>
                    <span>/</span>
                    <span className="text-gray-600 font-medium truncate max-w-[200px]">{post.title}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Post</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Status: <span className={`font-semibold ${post.status === "published" ? "text-green-700" : "text-gray-500"}`}>{post.status}</span>
                    {post.published_at && (
                        <> · Published {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                    )}
                </p>
            </div>
            <BlogPostEditForm post={post} />
        </div>
    );
}
