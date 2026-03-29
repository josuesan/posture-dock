import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import {
  getSupabasePublishableDefaultKey,
  getSupabaseUrl,
  hasSupabaseConfig
} from '@/utils/supabase/env';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const createClient = async (cookieStore?: CookieStore) => {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const resolvedCookieStore = cookieStore ?? (await cookies());

  return createServerClient(
    getSupabaseUrl()!,
    getSupabasePublishableDefaultKey()!,
    {
      cookies: {
        getAll() {
          return resolvedCookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              resolvedCookieStore.set(name, value, options)
            );
          } catch {
            // Ignore writes from Server Components when session refresh
            // happens through middleware.
          }
        }
      }
    }
  );
};
