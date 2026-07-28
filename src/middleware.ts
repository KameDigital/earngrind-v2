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
    const isAccountRoute = request.nextUrl.pathname === '/account' || request.nextUrl.pathname.startsWith('/account/');
    const isLoginRoute = request.nextUrl.pathname === '/login';
    const isSignupRoute = request.nextUrl.pathname === '/signup';

    // Explicit admin protection. Keep this in addition to the broader /app guard and robots exclusions.
    if (isAdminRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect /app/* routes
    if (isAppRoute && !user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
    }

    if (isAccountRoute && !user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from the login page
    if ((isLoginRoute || isSignupRoute) && user) {
        return NextResponse.redirect(new URL('/account', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/app/:path*', '/account', '/account/:path*', '/login', '/signup'],
};
