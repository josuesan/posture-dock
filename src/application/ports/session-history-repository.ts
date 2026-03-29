import type { AuthUser } from '@/domain/auth/types';
import type { SavedSessionRecord } from '@/domain/session-history/types';

export interface SessionHistoryRepository {
  load(user: AuthUser | null): Promise<SavedSessionRecord[]>;
  save(
    record: SavedSessionRecord,
    user: AuthUser | null
  ): Promise<{
    records: SavedSessionRecord[];
    syncState: 'local-only' | 'synced' | 'local-failed';
    error?: string;
  }>;
  delete(recordId: string, user: AuthUser | null): Promise<SavedSessionRecord[]>;
}
