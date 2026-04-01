import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client uses the anonymous key. 
// It relies entirely on Database RLS policies to restrict data access.
export const supabase = createClient(supabaseUrl, supabaseKey);
