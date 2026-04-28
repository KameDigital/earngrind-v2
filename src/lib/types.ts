export interface Review {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body_md: string;
    rating: number | null;
    pros: string[];
    cons: string[];
    affiliate_url: string | null;
    status: "draft" | "needs_review" | "published";
    published_at: string | null;
    updated_at: string;
}

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body_md: string;
    status: "draft" | "needs_review" | "published";
    published_at: string | null;
    updated_at: string;
}
