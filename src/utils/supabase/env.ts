const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export function getSupabaseUrl() {
  return supabaseUrl ?? null;
}

export function getSupabasePublishableDefaultKey() {
  return supabaseKey ?? null;
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableDefaultKey());
}
