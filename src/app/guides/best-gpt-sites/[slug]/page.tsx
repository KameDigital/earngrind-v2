import { permanentRedirect } from "next/navigation";
import { GPT_SITE_GUIDES } from "@/lib/gpt-site-guides";

export function generateStaticParams() {
    return GPT_SITE_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export default function GptSiteGuideRedirectPage({
    params,
}: {
    params: { slug: string };
}) {
    permanentRedirect(`/best-gpt-sites/${params.slug}`);
}
