const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseUrl() {
  return SUPABASE_URL ?? null;
}

export function getSupabasePublishableKey() {
  return SUPABASE_PUBLISHABLE_KEY ?? null;
}

export function hasSupabaseEnvConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
