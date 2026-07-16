"use client";

import { useFormState } from "react-dom";
import { saveProfile, type ProfileActionState } from "@/app/account/actions";
import SubmitButton from "./SubmitButton";

const initialState: ProfileActionState = {};

export default function AccountSettingsForm({ profile, countries }: { profile: { username?: string | null; display_name?: string | null; avatar_url?: string | null; country_code?: string | null; preferred_device?: string | null }; countries: { code: string; name: string }[] }) {
    const [state, action] = useFormState(saveProfile, initialState);
    return <form action={action} className="mt-8 space-y-5 border border-[var(--border-default)] bg-white p-5 sm:p-6">
        {state.error ? <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p> : null}
        {state.success ? <p role="status" className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{state.success}</p> : null}
        <TextField label="Username" name="username" defaultValue={profile.username ?? ""} hint="Optional. 3–30 lowercase letters, numbers, underscores, or hyphens." />
        <TextField label="Display name" name="display_name" defaultValue={profile.display_name ?? ""} />
        <TextField label="Avatar URL" name="avatar_url" defaultValue={profile.avatar_url ?? ""} hint="Optional HTTPS image URL." />
        <label className="block text-sm font-bold text-[var(--brand-ink)]">Country<select name="country_code" defaultValue={profile.country_code ?? "US"} className="mt-1.5 block w-full border border-[var(--border-default)] bg-white px-3 py-2 text-sm">{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label className="block text-sm font-bold text-[var(--brand-ink)]">Preferred device<select name="preferred_device" defaultValue={profile.preferred_device ?? "all"} className="mt-1.5 block w-full border border-[var(--border-default)] bg-white px-3 py-2 text-sm"><option value="all">All devices</option><option value="android">Android</option><option value="ios">iOS</option><option value="desktop">Desktop</option></select></label>
        <SubmitButton />
    </form>;
}

function TextField({ label, name, defaultValue, hint }: { label: string; name: string; defaultValue: string; hint?: string }) { return <label className="block text-sm font-bold text-[var(--brand-ink)]">{label}<input name={name} defaultValue={defaultValue} className="mt-1.5 block w-full border border-[var(--border-default)] px-3 py-2 text-sm" />{hint ? <span className="mt-1 block text-xs font-normal text-[var(--text-secondary)]">{hint}</span> : null}</label>; }
