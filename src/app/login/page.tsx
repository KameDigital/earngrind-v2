import Link from "next/link";
import { login } from "./actions";
import { AuthCard, Field, Notice } from "@/components/account/AuthForm";
import SubmitButton from "@/components/account/SubmitButton";
import { getSafeReturnPath } from "@/lib/account-validation";

export const metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string; next?: string } }) {
    const next = getSafeReturnPath(searchParams.next);
    return <AuthCard title="Welcome back" subtitle="Log in to manage your private EarnGrind preferences.">
        {searchParams.error ? <Notice tone="error">{searchParams.error}</Notice> : null}
        {searchParams.message ? <Notice tone="success">{searchParams.message}</Notice> : null}
        <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <Field label="Email" name="email" type="email" autoComplete="email" />
            <Field label="Password" name="password" type="password" autoComplete="current-password" minLength={8} />
            <SubmitButton>Log in</SubmitButton>
        </form>
        <p className="mt-5 text-sm text-[var(--text-secondary)]">New to EarnGrind? <Link className="font-bold text-[var(--brand-ink)] underline" href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>.</p>
    </AuthCard>;
}
