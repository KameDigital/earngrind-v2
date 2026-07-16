import Link from "next/link";
import { signup } from "@/app/login/actions";
import { AuthCard, Field, Notice } from "@/components/account/AuthForm";
import SubmitButton from "@/components/account/SubmitButton";
import { getSafeReturnPath } from "@/lib/account-validation";

export const metadata = { title: "Create account" };

export default function SignupPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
    const next = getSafeReturnPath(searchParams.next);
    return <AuthCard title="Create your account" subtitle="Offer browsing stays public. Your preferences stay private.">
        {searchParams.error ? <Notice tone="error">{searchParams.error}</Notice> : null}
        <form action={signup} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <Field label="Email" name="email" type="email" autoComplete="email" />
            <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} />
            <p className="text-xs text-[var(--text-secondary)]">Use at least 8 characters. If email confirmation is enabled, we’ll send a secure confirmation link.</p>
            <SubmitButton>Create account</SubmitButton>
        </form>
        <p className="mt-5 text-sm text-[var(--text-secondary)]">Already have an account? <Link className="font-bold text-[var(--brand-ink)] underline" href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>.</p>
    </AuthCard>;
}
