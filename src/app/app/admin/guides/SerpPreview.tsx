export default function SerpPreview({
    title,
    url,
    description,
}: {
    title: string;
    url: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-100 text-xs font-black text-lime-700">E</div>
                <div className="min-w-0">
                    <div className="text-sm text-gray-900">EarnGrind</div>
                    <div className="truncate text-xs text-gray-500">{url}</div>
                </div>
            </div>
            <div className="text-xl font-normal leading-snug text-[#1a0dab]">{title || "SEO title preview"}</div>
            <p className="mt-1 text-sm leading-6 text-[#4d5156]">{description || "SEO description preview"}</p>
        </div>
    );
}
