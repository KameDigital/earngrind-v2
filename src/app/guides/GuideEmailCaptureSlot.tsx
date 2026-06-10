"use client";

import { usePathname } from "next/navigation";
import EmailCapture from "@/components/EmailCapture";

export default function GuideEmailCaptureSlot() {
    const pathname = usePathname();
    if (pathname === "/guides") return null;

    return (
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <p className="section-label mb-3">Stay updated</p>
            <EmailCapture variant="stacked" />
        </section>
    );
}
