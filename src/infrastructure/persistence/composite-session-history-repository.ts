import type { SessionHistoryRepository } from '@/application/ports/session-history-repository';
import type { AuthUser } from '@/domain/auth/types';
import type { SavedSessionRecord } from '@/domain/session-history/types';
import { BrowserSessionHistoryRepository } from '@/infrastructure/persistence/browser-session-history-repository';
import { SupabaseSessionHistoryRepository } from '@/infrastructure/persistence/supabase-session-history-repository';

function sortRecords(records: SavedSessionRecord[]) {
  return [...records].sort(
    (left, right) =>
      new Date(right.summary.startedAtIso).getTime() -
      new Date(left.summary.startedAtIso).getTime()
  );
}

function mergeRecords(records: SavedSessionRecord[]) {
  const unique = new Map<string, SavedSessionRecord>();

  records.forEach((record) => {
    const current = unique.get(record.summary.id);

    if (!current) {
      unique.set(record.summary.id, record);
      return;
    }

    if (current.source === 'local' && record.source !== 'local') {
      unique.set(record.summary.id, {
        ...record,
        source: 'local+supabase'
      });
      return;
    }

    unique.set(record.summary.id, current);
  });

  return sortRecords([...unique.values()]);
}

export class CompositeSessionHistoryRepository
  implements SessionHistoryRepository
{
  constructor(
    private readonly browserRepository = new BrowserSessionHistoryRepository(),
    private readonly remoteRepository = new SupabaseSessionHistoryRepository()
  ) {}

  async load(user: AuthUser | null) {
    const localRecords = this.browserRepository.load(user);
    const remoteRecords = await this.remoteRepository.load(user);
    const merged = mergeRecords([...localRecords, ...remoteRecords]);
    this.browserRepository.write(user, merged);
    return merged;
  }

  async save(record: SavedSessionRecord, user: AuthUser | null) {
    const localRecords = mergeRecords([record, ...this.browserRepository.load(user)]);
    this.browserRepository.write(user, localRecords);
    const remoteResult = await this.remoteRepository.save(record, user);

    if (remoteResult.syncState !== 'synced') {
      return {
        records: localRecords,
        syncState: remoteResult.syncState,
        error: remoteResult.error
      };
    }

    const merged = mergeRecords([
      {
        ...record,
        source: 'local+supabase',
        syncedAtIso: remoteResult.syncedAtIso
      },
      ...localRecords
    ]);
    this.browserRepository.write(user, merged);

    return {
      records: merged,
      syncState: 'synced' as const
    };
  }

  async delete(recordId: string, user: AuthUser | null) {
    const nextRecords = this.browserRepository
      .load(user)
      .filter((record) => record.summary.id !== recordId);
    this.browserRepository.write(user, nextRecords);
    await this.remoteRepository.delete(recordId, user);
    return nextRecords;
  }
}
