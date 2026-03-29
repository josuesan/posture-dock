import type { AuthUser } from '@/domain/auth/types';
import type {
  PostureReport,
  SavedSessionRecord,
  SavedSessionSummary,
  TimelinePoint
} from '@/domain/session-history/types';
import {
  hasSupabaseConfig,
  SUPABASE_TABLE
} from '@/infrastructure/auth/supabase-auth-gateway';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function getClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return cachedClient;
}

function sanitizeRemoteRecord(
  payload: unknown
): SavedSessionRecord | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as {
    summary?: SavedSessionSummary;
    report?: PostureReport;
    timeline?: TimelinePoint[];
    synced_at?: string | null;
  };

  if (!candidate.summary || !candidate.report || !candidate.timeline) {
    return null;
  }

  return {
    summary: candidate.summary,
    report: candidate.report,
    timeline: candidate.timeline,
    source: 'supabase',
    syncedAtIso: candidate.synced_at ?? null
  };
}

export class SupabaseSessionHistoryRepository {
  isAvailable() {
    return hasSupabaseConfig();
  }

  async load(user: AuthUser | null) {
    const client = getClient();

    if (!client || !user) {
      return [];
    }

    const { data, error } = await client
      .from(SUPABASE_TABLE)
      .select('summary, report, timeline, synced_at')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data
      .map((item) => sanitizeRemoteRecord(item))
      .filter((item): item is SavedSessionRecord => item !== null);
  }

  async save(record: SavedSessionRecord, user: AuthUser | null) {
    const client = getClient();

    if (!client || !user) {
      return {
        syncState: 'local-only' as const
      };
    }

    const syncedAtIso = new Date().toISOString();
    const payload = {
      id: record.summary.id,
      user_id: user.id,
      summary: record.summary,
      report: record.report,
      timeline: record.timeline,
      dominant_issue: record.report.dominantIssue,
      duration_ms: record.summary.durationMs,
      pose_confidence: record.summary.poseConfidence,
      synced_at: syncedAtIso
    };
    const { error } = await client.from(SUPABASE_TABLE).upsert(payload);

    if (error) {
      return {
        syncState: 'local-failed' as const,
        error: error.message
      };
    }

    return {
      syncState: 'synced' as const,
      syncedAtIso
    };
  }

  async delete(recordId: string, user: AuthUser | null) {
    const client = getClient();

    if (!client || !user) {
      return;
    }

    await client.from(SUPABASE_TABLE).delete().eq('id', recordId).eq('user_id', user.id);
  }
}
