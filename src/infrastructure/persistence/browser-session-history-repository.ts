import { HISTORY_STORAGE_KEY } from '@/domain/posture/constants';
import type { AuthUser } from '@/domain/auth/types';
import type { SavedSessionRecord } from '@/domain/session-history/types';

function getStorageKey(user: AuthUser | null) {
  return `${HISTORY_STORAGE_KEY}:${user?.id ?? 'guest'}`;
}

function sortRecords(records: SavedSessionRecord[]) {
  return [...records].sort(
    (left, right) =>
      new Date(right.summary.startedAtIso).getTime() -
      new Date(left.summary.startedAtIso).getTime()
  );
}

export class BrowserSessionHistoryRepository {
  load(user: AuthUser | null) {
    if (typeof window === 'undefined') {
      return [];
    }

    const keys = user ? [getStorageKey(user), getStorageKey(null)] : [getStorageKey(null)];
    const unique = new Map<string, SavedSessionRecord>();

    keys.forEach((key) => {
      const rawValue = window.localStorage.getItem(key);

      if (!rawValue) {
        return;
      }

      try {
        const records = JSON.parse(rawValue) as SavedSessionRecord[];
        records.forEach((record) => {
          unique.set(record.summary.id, record);
        });
      } catch {
        return;
      }
    });

    return sortRecords([...unique.values()]);
  }

  write(user: AuthUser | null, records: SavedSessionRecord[]) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      getStorageKey(user),
      JSON.stringify(sortRecords(records))
    );
  }
}
