import type { ReactNode } from "react";
import GuideEmailCaptureSlot from "./GuideEmailCaptureSlot";

export default function GuidesLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <GuideEmailCaptureSlot />
        </>
    );
}
