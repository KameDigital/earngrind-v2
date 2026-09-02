import { permanentRedirect } from "next/navigation";

export default function ReviewsSlugRedirect({
    params,
}: {
    params: { slug: string };
}) {
    permanentRedirect(`/best-gpt-sites/${params.slug}`);
}
