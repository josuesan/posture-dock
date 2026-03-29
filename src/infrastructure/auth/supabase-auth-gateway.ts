import type { Session } from '@supabase/supabase-js';

import type { AuthGateway } from '@/application/ports/auth-gateway';
import type { AuthUser } from '@/domain/auth/types';
import { messages } from '@/translations';
import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client';
import { hasSupabaseConfig as hasSupabaseEnvConfig } from '@/utils/supabase/env';

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null
  };
}

export function hasSupabaseConfig() {
  return hasSupabaseEnvConfig();
}

function getSupabaseBrowserClient() {
  return createSupabaseBrowserClient();
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
