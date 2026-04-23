import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { input } = await req.json();
        
        if (!input || typeof input !== "string") {
            return NextResponse.json({ error: "No input provided" }, { status: 400 });
        }

        let textToParse = input.trim();
        let titleSource = "text";
        let titleFoundFromHtml = "";
        
        // If it looks like a URL
        if (/^https?:\/\//i.test(textToParse)) {
            try {
                const res = await fetch(textToParse, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    }
                });
                if (res.ok) {
                    const html = await res.text();
                    
                    // extract title
                    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/im);
                    if (titleMatch) {
                        titleFoundFromHtml = titleMatch[1].trim();
                        // decode basic html entities
                        titleFoundFromHtml = titleFoundFromHtml
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&#39;/g, "'")
                            .replace(/&quot;/g, '"');
                    }
                    
                    // search body for payout
                    textToParse = html; 
                    titleSource = "url";
                }
            } catch (error) {
                console.error("Magic Wand parsing URL error:", error);
                // Fail silently, fallback to regexing the input string itself just in case
            }
        }
        
        // --- 1. Find Payout ---
        // Look for $ amount, optionally with commas and decimals
        let payout = "";
        const payoutMatch = textToParse.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (payoutMatch) {
            payout = payoutMatch[1].replace(/,/g, '');
        } else {
            // Also looking for general patterns like "24.50 USD"
            const altPayoutMatch = textToParse.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s?(?:USD)/i);
            if (altPayoutMatch) payout = altPayoutMatch[1].replace(/,/g, '');
        }

        // --- 2. Extract Title ---
        let title = "";
        if (titleSource === "url" && titleFoundFromHtml) {
            title = titleFoundFromHtml;
        } else {
            // for text, title is the text stripped of the payout match
            title = input.replace(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/, '');
            title = title.replace(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s?(?:USD)/i, '');
        }
        
        // Post-process title: remove typical site names at the end
        title = title.replace(/\s*[|:-]\s*(Freecash|Swagbucks|OfferToro|AdGem|RevU).*$/i, ''); 
        title = title.replace(/\s*[|:-]\s*$/, '').trim(); // Remove trailing dash or pipe
        title = title.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

        return NextResponse.json({
            title,
            payout
        });
        
    } catch (error: any) {
        console.error("Magic Wand error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
