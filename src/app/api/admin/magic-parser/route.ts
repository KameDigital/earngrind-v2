import { lookup } from "dns/promises";
import { isIP } from "net";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["admin", "editor"].includes(profile.role)) return null;
    return user;
}

function isPrivateIp(address: string): boolean {
    const version = isIP(address);
    if (version === 4) {
        const parts = address.split(".").map((part) => Number(part));
        const [a, b] = parts;
        return (
            a === 10 ||
            a === 127 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 169 && b === 254) ||
            address === "0.0.0.0"
        );
    }

    if (version === 6) {
        const normalized = address.toLowerCase();
        return (
            normalized === "::1" ||
            normalized === "::" ||
            normalized.startsWith("fc") ||
            normalized.startsWith("fd") ||
            normalized.startsWith("fe80:")
        );
    }

    return false;
}

async function validateFetchableUrl(input: string): Promise<URL> {
    let url: URL;
    try {
        url = new URL(input);
    } catch {
        throw new Error("Invalid URL");
    }

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Only http and https URLs are allowed");
    }

    const hostname = url.hostname.toLowerCase();
    if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        isPrivateIp(hostname)
    ) {
        throw new Error("Local and private network URLs are not allowed");
    }

    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (addresses.some((entry) => isPrivateIp(entry.address))) {
        throw new Error("Local and private network URLs are not allowed");
    }

    return url;
}

function decodeBasicHtmlEntities(value: string) {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, "\"");
}

export async function POST(req: NextRequest) {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const { input } = await req.json();

        if (!input || typeof input !== "string") {
            return NextResponse.json({ error: "No input provided" }, { status: 400 });
        }

        let textToParse = input.trim();
        let titleSource = "text";
        let titleFoundFromHtml = "";

        if (/^https?:\/\//i.test(textToParse)) {
            let url: URL;
            try {
                url = await validateFetchableUrl(textToParse);
            } catch (error) {
                return NextResponse.json(
                    { error: error instanceof Error ? error.message : "Invalid URL" },
                    { status: 400 },
                );
            }

            try {
                const res = await fetch(url, {
                    redirect: "manual",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    },
                });

                if (res.ok) {
                    const html = await res.text();
                    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/im);
                    if (titleMatch) {
                        titleFoundFromHtml = decodeBasicHtmlEntities(titleMatch[1].trim());
                    }

                    textToParse = html;
                    titleSource = "url";
                }
            } catch {
                return NextResponse.json({ error: "Unable to fetch URL" }, { status: 502 });
            }
        }

        let payout = "";
        const payoutMatch = textToParse.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (payoutMatch) {
            payout = payoutMatch[1].replace(/,/g, "");
        } else {
            const altPayoutMatch = textToParse.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s?(?:USD)/i);
            if (altPayoutMatch) payout = altPayoutMatch[1].replace(/,/g, "");
        }

        let title = "";
        if (titleSource === "url" && titleFoundFromHtml) {
            title = titleFoundFromHtml;
        } else {
            title = input.replace(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/, "");
            title = title.replace(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s?(?:USD)/i, "");
        }

        title = title.replace(/\s*[|:-]\s*(Freecash|Swagbucks|OfferToro|AdGem|RevU).*$/i, "");
        title = title.replace(/\s*[|:-]\s*$/, "").trim();
        title = title.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();

        return NextResponse.json({ title, payout });
    } catch {
        return NextResponse.json({ error: "Magic parser failed" }, { status: 500 });
    }
}
