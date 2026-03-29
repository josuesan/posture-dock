import type { AuthUser } from '@/domain/auth/types';
import type { SavedSessionRecord } from '@/domain/session-history/types';
import type { SessionHistoryRepository } from '@/application/ports/session-history-repository';

export async function loadSessionHistory(
  repository: SessionHistoryRepository,
  user: AuthUser | null
) {
  return repository.load(user);
}

export async function saveSessionRecord(
  repository: SessionHistoryRepository,
  record: SavedSessionRecord,
  user: AuthUser | null
) {
  return repository.save(record, user);
}

export async function deleteSessionRecord(
  repository: SessionHistoryRepository,
  recordId: string,
  user: AuthUser | null
) {
  return repository.delete(recordId, user);
}
