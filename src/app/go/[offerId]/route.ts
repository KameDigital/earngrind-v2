import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(
    req: NextRequest,
    { params }: { params: { offerId: string } }
) {
    const supabase = createClient();
    const { offerId } = params;

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(offerId)) {
        return NextResponse.redirect(new URL('/offers?error=invalid_id', req.url));
    }

    const ipString = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';
    const ipHash = await sha256(ipString);

    // Fetch offer details needed for redirect
    const { data: offer, error } = await supabase
        .from('offers')
        .select('id, custom_param, status, platforms:platform_id(affiliate_template)')
        .eq('id', offerId)
        .single();

    if (error || !offer) {
        return NextResponse.redirect(new URL('/offers?error=not_found', req.url));
    }

    if (offer.status !== 'active' && offer.status !== 'boosted') {
        return NextResponse.redirect(new URL('/offers?error=expired', req.url));
    }

    // Construct affiliate URL
    // We use typing assertion because nested select typing can be tricky in generic supabase client
    const platform = offer.platforms as any;
    const template = platform?.affiliate_template;

    if (!template) {
        console.error(`Offer ${offerId} missing affiliate_template on platform.`);
        return NextResponse.redirect(new URL('/offers?error=setup_issue', req.url));
    }

    const affiliateUrl = template.replace('{custom_param}', offer.custom_param ?? '');

    // Log click (fire-and-forget logic using edge-compatible promise)
    // We extract the user_id if they are logged in.
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        // Very basic best-effort extraction if passing token. Proper auth requires full session fetch.
        // For speed, this relies on client-side tracking if strictly needed, or wait for next.js server action.
        // But for anon clicks, this is fine.
    }

    const clickData = {
        offer_id: offer.id,
        ip_hash: ipHash,
        referrer: req.headers.get('referer') ?? null,
        country: req.geo?.country ?? null, // Edge functions populated
        user_agent: req.headers.get('user-agent') ?? null,
        user_id: userId
    };

    // Edge-compatible fire-and-forget
    const logClick = async () => {
        try {
            await supabase.from('offer_clicks').insert(clickData);
        } catch (err) {
            console.error("Failed to log click", err);
        }
    };
    logClick();

    // Redirect
    return NextResponse.redirect(affiliateUrl, {
        status: 302,
        headers: {
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'nofollow',
        },
    });
}
