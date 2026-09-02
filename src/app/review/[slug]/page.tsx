import { permanentRedirect } from "next/navigation";

export default function ReviewSlugRedirect({
    params,
}: {
    params: { slug: string };
}) {
    permanentRedirect(`/best-gpt-sites/${params.slug}`);
}
