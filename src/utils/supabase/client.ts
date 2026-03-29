'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  getSupabasePublishableDefaultKey,
  getSupabaseUrl,
  hasSupabaseConfig
} from '@/utils/supabase/env';

let cachedClient: SupabaseClient | null = null;

export function createClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createBrowserClient(
      getSupabaseUrl()!,
      getSupabasePublishableDefaultKey()!
    );
  }

  return cachedClient;
}
