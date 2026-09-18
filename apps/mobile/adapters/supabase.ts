import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

export const mobileSupabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
