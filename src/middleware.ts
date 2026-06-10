import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isAdminRoute = request.nextUrl.pathname.startsWith('/app/admin');
    const isAppRoute = request.nextUrl.pathname.startsWith('/app');
    const isLoginRoute = request.nextUrl.pathname === '/login';

    // Explicit admin protection. Keep this in addition to the broader /app guard and robots exclusions.
    if (isAdminRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect /app/* routes
    if (isAppRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect authenticated users away from the login page
    if (isLoginRoute && user) {
        return NextResponse.redirect(new URL('/app/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/app/:path*', '/login'],
};
