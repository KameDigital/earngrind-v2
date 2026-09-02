import { permanentRedirect } from "next/navigation";

export default function BestGptSlugRedirect({
    params,
}: {
    params: { slug: string };
}) {
    permanentRedirect(`/best-gpt-sites/${params.slug}`);
}
