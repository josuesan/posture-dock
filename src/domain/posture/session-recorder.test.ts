import { describe, expect, it } from 'vitest';

import { createSessionRecorder } from './session-recorder';
import type { ExtractedPoseSnapshot } from './types';

function makeSnapshot(
  timestampMs: number,
  overrides?: Partial<ExtractedPoseSnapshot>
): ExtractedPoseSnapshot {
  return {
    timestampMs,
    trackingConfidence: 0.92,
    torsoLeanDeg: 6,
    shoulderLiftDeg: 6,
    shoulderSlopeDeg: 2,
    headForwardCm: 3,
    torsoCenterXcm: 50,
    ...overrides
  };
}

describe('createSessionRecorder', () => {
  it('keeps tracking state stable for a neutral sequence', () => {
    const recorder = createSessionRecorder({
      title: 'Test',
      settings: {
        cameraDeviceId: null,
        cameraLabel: 'Default',
        zoom: null,
        soundEnabled: true,
        alertCooldownMs: 5000,
        inferenceStride: 1,
        thresholds: {
          leanWarnDeg: 11,
          leanHighDeg: 18,
          headForwardWarnCm: 6,
          headForwardHighCm: 10,
          shoulderLiftWarnDeg: 12,
          shoulderLiftHighDeg: 18,
          shoulderSlopeWarnDeg: 6,
          shoulderSlopeHighDeg: 10,
          torsoOffsetWarnCm: 10,
          torsoOffsetHighCm: 16
        }
      }
    });

    recorder.start(0);
    for (let index = 0; index < 16; index += 1) {
      recorder.consumeSnapshot(makeSnapshot(index * 120));
    }

    const state = recorder.getTrackingState();
    const session = recorder.stop(2400);

    expect(state.activeIssues).toHaveLength(0);
    expect(state.poseConfidence).toBeGreaterThan(0.8);
    expect(session?.alerts).toHaveLength(0);
    expect(session?.durationMs).toBe(2400);
  });

  it('emits alerts and persists samples when posture degrades', () => {
    const recorder = createSessionRecorder({
      title: 'Test',
      settings: {
        cameraDeviceId: null,
        cameraLabel: 'Default',
        zoom: null,
        soundEnabled: true,
        alertCooldownMs: 1000,
        inferenceStride: 1,
        thresholds: {
          leanWarnDeg: 11,
          leanHighDeg: 18,
          headForwardWarnCm: 6,
          headForwardHighCm: 10,
          shoulderLiftWarnDeg: 12,
          shoulderLiftHighDeg: 18,
          shoulderSlopeWarnDeg: 6,
          shoulderSlopeHighDeg: 10,
          torsoOffsetWarnCm: 10,
          torsoOffsetHighCm: 16
        }
      }
    });

    recorder.start(0);

    for (let index = 0; index < 14; index += 1) {
      recorder.consumeSnapshot(makeSnapshot(index * 120));
    }

    for (let index = 14; index < 32; index += 1) {
      recorder.consumeSnapshot(
        makeSnapshot(index * 120, {
          torsoLeanDeg: 19,
          headForwardCm: 11,
          shoulderLiftDeg: 15,
          torsoCenterXcm: 66
        })
      );
    }

    const state = recorder.getTrackingState();
    const session = recorder.stop(4200);

    expect(state.activeIssues.length).toBeGreaterThan(0);
    expect(state.lastAlert).not.toBeNull();
    expect(session).not.toBeNull();
    expect(session!.alerts.length).toBeGreaterThan(0);
    expect(
      session!.snapshots.some((sample) =>
        sample.issues.some((issue) => issue.kind === 'lean')
      )
    ).toBe(true);
  });
});
