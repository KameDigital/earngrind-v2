// Auth debug script — run with: ts-node debug_auth.ts
import "dotenv/config";

const url = process.env.SUPABASE_URL ?? "(not set)";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "(not set)";
const fnUrl = process.env.SUPABASE_FUNCTION_URL ?? "(not set)";

console.log("=== Auth Debug Report ===");
console.log(`SUPABASE_URL:              ${url}`);
console.log(`SUPABASE_FUNCTION_URL:     ${fnUrl}`);
console.log(`SERVICE_ROLE_KEY exists:   ${key !== "(not set)" && key.length > 0}`);
console.log(`SERVICE_ROLE_KEY length:   ${key.length}`);
console.log(`SERVICE_ROLE_KEY first 8:  ${key.slice(0, 8)}`);
console.log(`SERVICE_ROLE_KEY last 6:   ${key.slice(-6)}`);
console.log(`SERVICE_ROLE_KEY is placeholder: ${key === "PASTE_YOUR_SERVICE_ROLE_KEY_HERE"}`);
console.log("=========================");

if (key === "PASTE_YOUR_SERVICE_ROLE_KEY_HERE" || key === "(not set)" || key.length < 20) {
    console.error("\n❌ ROOT CAUSE: SUPABASE_SERVICE_ROLE_KEY is not set to a real key.");
    console.error("   Open workers/.env and replace the placeholder with your actual service_role key.");
    console.error("   Get it from: https://supabase.com/dashboard/project/mgevesyscdxdwabaqmyx/settings/api");
    process.exit(1);
}

// Test 1: Supabase DB read
console.log("\n[Test 1] Supabase DB read (games table)...");
import("@supabase/supabase-js").then(async ({ createClient }) => {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from("games").select("id, slug").limit(5);
    if (error) {
        console.error(`  ❌ DB read failed: ${error.message}`);
    } else {
        console.log(`  ✅ DB read succeeded: ${data?.length ?? 0} games found`);
        data?.forEach(g => console.log(`     - ${g.slug} (${g.id})`));
    }

    // Test 2: Edge Function auth
    console.log("\n[Test 2] Edge Function auth (OPTIONS-like probe)...");
    try {
        const res = await fetch(`${fnUrl}/ingest-offers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`,
                "apikey": key,
            },
            body: JSON.stringify({ platform_slug: "__debug__", offers: [] }),
        });
        const body = await res.text();
        console.log(`  Status: ${res.status}`);
        console.log(`  Body:   ${body}`);
        if (res.status === 200 || res.status === 400) {
            console.log("  ✅ Edge Function auth succeeded (400 = auth ok, payload rejected as expected)");
        } else if (res.status === 401) {
            console.log("  ❌ Edge Function returned 401 — key is wrong or auth header mismatch");
        }
    } catch (e) {
        console.error(`  ❌ Edge Function request failed: ${(e as Error).message}`);
    }
});
