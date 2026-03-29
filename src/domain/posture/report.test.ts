import { describe, expect, it } from 'vitest';

import { analyzeSession } from './report';
import type { PostureSample, PostureSession } from './types';

function makeSample(
  timestampMs: number,
  overrides?: Partial<PostureSample>
): PostureSample {
  return {
    timestampMs,
    trackingConfidence: 0.91,
    torsoLeanDeg: 6,
    shoulderLiftDeg: 7,
    shoulderSlopeDeg: 2,
    headForwardCm: 3,
    torsoCenterXcm: 0,
    torsoOffsetXCm: 0,
    issues: [],
    ...overrides
  };
}

function makeSession(samples: PostureSample[]): PostureSession {
  return {
    id: 'session-1',
    title: 'Sesion de prueba',
    durationMs: 60000,
    poseConfidence: 0.9,
    snapshots: samples,
    alerts: samples
      .filter((sample) => sample.issues.length > 0)
      .map((sample) => ({
        kind: sample.issues[0].kind,
        timestampMs: sample.timestampMs,
        severity: sample.issues[0].severity,
        message: sample.issues[0].label
      })),
    startedAtIso: '2026-03-29T10:00:00.000Z',
    endedAtIso: '2026-03-29T10:01:00.000Z',
    notes: 'test',
    settings: {
      cameraDeviceId: null,
      cameraLabel: 'Default',
      zoom: null,
      soundEnabled: true,
      alertCooldownMs: 10000,
      inferenceStride: 2,
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
  };
}

describe('analyzeSession', () => {
  it('returns strong scores for a mostly neutral session', () => {
    const samples = Array.from({ length: 20 }, (_, index) =>
      makeSample(index * 3000)
    );

    const report = analyzeSession(makeSession(samples));

    expect(report.overallScore).toBeGreaterThanOrEqual(85);
    expect(report.dominantIssue).toBe('balanced');
    expect(report.neutralPercent).toBe(100);
    expect(report.recommendations.some((item) => item.id === 'balanced')).toBe(true);
  });

  it('surfaces head-forward and lean issues with weaker scores', () => {
    const badIssue = {
      kind: 'headForward' as const,
      label: 'Cabeza adelantada',
      value: 11,
      threshold: 6,
      severity: 'high' as const
    };
    const samples = Array.from({ length: 24 }, (_, index) =>
      makeSample(index * 2500, {
        torsoLeanDeg: 16,
        headForwardCm: 11,
        shoulderLiftDeg: 14,
        issues: [badIssue]
      })
    );

    const report = analyzeSession(makeSession(samples));

    expect(report.overallScore).toBeLessThan(70);
    expect(report.dominantIssue).toBe('headForward');
    expect(report.badPostureTimeMs).toBeGreaterThan(40000);
    expect(
      report.recommendations.some((item) => item.id === 'head-forward')
    ).toBe(true);
  });
});
