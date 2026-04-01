import { redirect } from "next/navigation";

/**
 * Legacy /terms route — redirects permanently to the canonical /legal/terms page.
 * The actual Terms of Service content lives at /legal/terms.
 */
export default function TermsRedirect() {
    redirect("/legal/terms");
}
