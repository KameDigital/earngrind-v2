import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSafeReturnPath } from "@/lib/account-validation";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const next = getSafeReturnPath(request.nextUrl.searchParams.get("next"));
    const response = NextResponse.redirect(new URL(code ? next : "/login?error=Confirmation+link+is+invalid+or+expired.", request.url));

    if (!code) return response;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return request.cookies.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }); },
                remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: "", ...options }); },
            },
        },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=Confirmation+link+is+invalid+or+expired.", request.url));
    return response;
}
