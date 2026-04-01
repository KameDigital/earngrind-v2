import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
    const fnUrl = process.env.SUPABASE_FUNCTION_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbUrl = process.env.SUPABASE_URL;

    console.log("DB URL:", dbUrl);
    console.log("FN URL:", fnUrl);
    console.log("KEY first 10:", key?.slice(0, 10));

    // DB Test
    const supabase = createClient(dbUrl!, key!);
    const { data: dbData, error: dbErr } = await supabase.from("games").select("id").limit(1);
    console.log("DB Test:", dbErr ? dbErr.message : "OK", dbData);

    // Edge Fn Test
    console.log("Fetching...", `${fnUrl}/ingest-offers`);
    const res = await fetch(`${fnUrl}/ingest-offers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "apikey": key!
        },
        body: JSON.stringify({ platform_slug: "mock", offers: [] })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
main();
