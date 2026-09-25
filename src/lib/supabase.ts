import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client — configured only from environment variables.
 * If the variables are missing, the app keeps working and services
 * report DATA_PROVIDER_NOT_CONNECTED instead of crashing.
 */
const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const anonKey = (import.meta.env['VITE_SUPABASE_ANON_KEY'] ??
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']) as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) client = createClient(url as string, anonKey as string);
  return client;
}
