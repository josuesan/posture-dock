import type { Session, SupabaseClient } from '@supabase/supabase-js';

import type { AuthGateway } from '@/application/ports/auth-gateway';
import type { AuthUser } from '@/domain/auth/types';
import { createClient } from '@supabase/supabase-js';
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseEnvConfig
} from '@/infrastructure/auth/supabase-env';
import { messages } from '@/translations';

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null
  };
}

let cachedClient: SupabaseClient | null = null;

export function hasSupabaseConfig() {
  return hasSupabaseEnvConfig();
}

function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(
      getSupabaseUrl()!,
      getSupabasePublishableKey()!
    );
  }

  return cachedClient;
}

export class SupabaseAuthGateway implements AuthGateway {
  isAvailable() {
    return hasSupabaseConfig();
  }

  async getCurrentUser() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return null;
    }

    const { data } = await supabase.auth.getSession();
    return toAuthUser(data.session);
  }

  async signInWithMagicLink(email: string) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return {
        error: messages.auth.unavailableTitle
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    return error ? { error: error.message } : {};
  }

  async signOut() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return {};
    }

    const { error } = await supabase.auth.signOut();
    return error ? { error: error.message } : {};
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(toAuthUser(session));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }
}

export const SUPABASE_TABLE = 'posture_sessions';
