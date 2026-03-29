import type { PostureSession } from '@/domain/posture/types';
import type {
  PostureReport,
  SavedSessionRecord,
  TimelinePoint
} from '@/domain/session-history/types';

function buildTimeline(session: PostureSession): TimelinePoint[] {
  const firstTimestamp = session.snapshots[0]?.timestampMs ?? 0;
  const maxPoints = 42;
  const step = Math.max(1, Math.floor(session.snapshots.length / maxPoints));

  return session.snapshots
    .filter((_, index) => index % step === 0 || index === session.snapshots.length - 1)
    .map((snapshot) => ({
      elapsedMs: Math.max(0, Math.round(snapshot.timestampMs - firstTimestamp)),
      leanDeg: Math.round(snapshot.torsoLeanDeg * 10) / 10,
      headForwardCm: Math.round(snapshot.headForwardCm * 10) / 10,
      issueCount: snapshot.issues.length
    }));
}

export function buildSavedSessionRecord(
  session: PostureSession,
  report: PostureReport
): SavedSessionRecord {
  return {
    summary: {
      id: session.id,
      title: session.title,
      durationMs: session.durationMs,
      poseConfidence: session.poseConfidence,
      startedAtIso: session.startedAtIso,
      endedAtIso: session.endedAtIso,
      notes: session.notes,
      settings: session.settings
    },
    report,
    timeline: buildTimeline(session),
    source: 'local',
    syncedAtIso: null
  };
}
