import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import {
  getSupabasePublishableDefaultKey,
  getSupabaseUrl,
  hasSupabaseConfig
} from '@/utils/supabase/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  if (!hasSupabaseConfig()) {
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabasePublishableDefaultKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}
