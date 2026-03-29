import type {
  PostureIssue,
  PostureSample,
  PostureSession,
  Severity
} from '@/domain/posture/types';
import type {
  PostureRecommendation,
  PostureReport
} from '@/domain/session-history/types';
import { messages } from '@/translations';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getIssueLabel(kind: PostureIssue): string {
  return messages.common.issueDetailedLabels[kind];
}

function getAffectedPercent(
  snapshots: PostureSample[],
  kind: PostureIssue
): number {
  const affected = snapshots.filter((snapshot) =>
    snapshot.issues.some((issue) => issue.kind === kind)
  ).length;

  return affected / snapshots.length;
}

function getAverageExcess(snapshots: PostureSample[], kind: PostureIssue): number {
  const values = snapshots.map((snapshot) => {
    const thresholds = snapshot.issues.find((issue) => issue.kind === kind)?.threshold;

    switch (kind) {
      case 'lean':
        return Math.max(0, snapshot.torsoLeanDeg - (thresholds ?? 0));
      case 'headForward':
        return Math.max(0, snapshot.headForwardCm - (thresholds ?? 0));
      case 'shoulders':
        return Math.max(
          0,
          Math.max(snapshot.shoulderLiftDeg, snapshot.shoulderSlopeDeg) -
            (thresholds ?? 0)
        );
      case 'offCenter':
        return Math.max(0, Math.abs(snapshot.torsoOffsetXCm) - (thresholds ?? 0));
    }
  });

  return average(values);
}

function getSeverityFromPercent(affectedPercent: number): Severity {
  if (affectedPercent >= 0.45) {
    return 'high';
  }

  if (affectedPercent >= 0.22) {
    return 'medium';
  }

  return 'low';
}

function getLongestBadStreakMs(snapshots: PostureSample[]): number {
  let longestMs = 0;
  let currentMs = 0;

  for (let index = 1; index < snapshots.length; index += 1) {
    const current = snapshots[index];
    const previous = snapshots[index - 1];
    const delta = Math.max(0, current.timestampMs - previous.timestampMs);

    if (current.issues.length > 0) {
      currentMs += delta;
      longestMs = Math.max(longestMs, currentMs);
    } else {
      currentMs = 0;
    }
  }

  return longestMs;
}

function buildRecommendations(
  session: PostureSession,
  dominantIssue: PostureIssue | 'balanced',
  neutralRatio: number,
  avgLean: number,
  avgHeadForward: number,
  avgShoulderLift: number,
  avgShoulderSlope: number,
  avgOffset: number
): PostureRecommendation[] {
  const recommendations: PostureRecommendation[] = [];
  const issueImpact = {
    lean: getAffectedPercent(session.snapshots, 'lean'),
    headForward: getAffectedPercent(session.snapshots, 'headForward'),
    shoulders: getAffectedPercent(session.snapshots, 'shoulders'),
    offCenter: getAffectedPercent(session.snapshots, 'offCenter')
  };

  if (issueImpact.lean >= 0.25 || avgLean > 10) {
    recommendations.push({
      id: messages.report.recommendations.leanStack.id,
      title: messages.report.recommendations.leanStack.title,
      detail: messages.report.recommendations.leanStack.detail,
      severity: issueImpact.lean >= 0.45 ? 'high' : 'medium',
      focus: 'lean'
    });
  }

  if (issueImpact.headForward >= 0.2 || avgHeadForward > 5.5) {
    recommendations.push({
      id: messages.report.recommendations.headForward.id,
      title: messages.report.recommendations.headForward.title,
      detail: messages.report.recommendations.headForward.detail,
      severity: issueImpact.headForward >= 0.4 ? 'high' : 'medium',
      focus: 'headForward'
    });
  }

  if (issueImpact.shoulders >= 0.2 || avgShoulderLift > 11 || avgShoulderSlope > 5) {
    recommendations.push({
      id: messages.report.recommendations.shouldersRelax.id,
      title: messages.report.recommendations.shouldersRelax.title,
      detail: messages.report.recommendations.shouldersRelax.detail,
      severity: issueImpact.shoulders >= 0.42 ? 'high' : 'medium',
      focus: 'shoulders'
    });
  }

  if (issueImpact.offCenter >= 0.18 || avgOffset > 7) {
    recommendations.push({
      id: messages.report.recommendations.centering.id,
      title: messages.report.recommendations.centering.title,
      detail: messages.report.recommendations.centering.detail,
      severity: issueImpact.offCenter >= 0.35 ? 'medium' : 'low',
      focus: 'offCenter'
    });
  }

  if (neutralRatio < 0.62 || session.alerts.length >= 5) {
    recommendations.push({
      id: messages.report.recommendations.microBreaks.id,
      title: messages.report.recommendations.microBreaks.title,
      detail: messages.report.recommendations.microBreaks.detail,
      severity: neutralRatio < 0.45 ? 'high' : 'medium',
      focus: 'habits'
    });
  }

  if (dominantIssue === 'balanced' && neutralRatio >= 0.72) {
    recommendations.push({
      id: messages.report.recommendations.balanced.id,
      title: messages.report.recommendations.balanced.title,
      detail: messages.report.recommendations.balanced.detail,
      severity: 'low',
      focus: 'habits'
    });
  }

  return recommendations.slice(0, 5);
}

export function analyzeSession(session: PostureSession): PostureReport {
  const snapshots = session.snapshots;
  const avgLean = average(snapshots.map((snapshot) => snapshot.torsoLeanDeg));
  const avgHeadForward = average(
    snapshots.map((snapshot) => snapshot.headForwardCm)
  );
  const avgShoulderLift = average(
    snapshots.map((snapshot) => snapshot.shoulderLiftDeg)
  );
  const avgShoulderSlope = average(
    snapshots.map((snapshot) => snapshot.shoulderSlopeDeg)
  );
  const avgOffset = average(
    snapshots.map((snapshot) => Math.abs(snapshot.torsoOffsetXCm))
  );
  const neutralRatio =
    snapshots.filter((snapshot) => snapshot.issues.length === 0).length /
    snapshots.length;
  const highSeverityRatio =
    snapshots.filter((snapshot) =>
      snapshot.issues.some((issue) => issue.severity === 'high')
    ).length / snapshots.length;
  const longestBadStreakMs = getLongestBadStreakMs(snapshots);
  const longestBadStreakSec = longestBadStreakMs / 1000;
  const badPostureTimeMs = Math.round(session.durationMs * (1 - neutralRatio));
  const issueBreakdown = (
    ['lean', 'headForward', 'shoulders', 'offCenter'] as PostureIssue[]
  )
    .map((kind) => {
      const affectedPercent = getAffectedPercent(snapshots, kind);

      return {
        kind,
        label: getIssueLabel(kind),
        affectedPercent: Math.round(affectedPercent * 100),
        averageExcess: Math.round(getAverageExcess(snapshots, kind) * 10) / 10,
        severity: getSeverityFromPercent(affectedPercent)
      };
    })
    .sort((left, right) => right.affectedPercent - left.affectedPercent);

  const dominantIssue =
    issueBreakdown[0]?.affectedPercent >= 18 ? issueBreakdown[0].kind : 'balanced';
  const postureScore = clampScore(
    100 -
      Math.max(0, avgLean - 7) * 4.5 -
      Math.max(0, avgHeadForward - 4.5) * 5.8 -
      Math.max(0, avgShoulderLift - 10) * 2.7 -
      Math.max(0, avgShoulderSlope - 4.5) * 4.1
  );
  const stabilityScore = clampScore(
    100 -
      (1 - neutralRatio) * 58 -
      highSeverityRatio * 34 -
      Math.max(0, avgOffset - 6) * 3.1
  );
  const recoveryScore = clampScore(
    100 - longestBadStreakSec * 7.5 - session.alerts.length * 3.4
  );
  const focusScore = clampScore(
    100 -
      (1 - neutralRatio) * 42 -
      Math.max(0, (0.82 - session.poseConfidence) * 100) * 0.65
  );

  const recommendations = buildRecommendations(
    session,
    dominantIssue,
    neutralRatio,
    avgLean,
    avgHeadForward,
    avgShoulderLift,
    avgShoulderSlope,
    avgOffset
  );

  return {
    overallScore: clampScore(
      postureScore * 0.35 +
        stabilityScore * 0.3 +
        recoveryScore * 0.2 +
        focusScore * 0.15
    ),
    postureScore,
    stabilityScore,
    recoveryScore,
    focusScore,
    dominantIssue,
    neutralPercent: Math.round(neutralRatio * 100),
    badPostureTimeMs,
    longestBadStreakMs: Math.round(longestBadStreakMs),
    alertCount: session.alerts.length,
    averages: {
      leanDeg: Math.round(avgLean * 10) / 10,
      headForwardCm: Math.round(avgHeadForward * 10) / 10,
      shoulderLiftDeg: Math.round(avgShoulderLift * 10) / 10,
      shoulderSlopeDeg: Math.round(avgShoulderSlope * 10) / 10,
      torsoOffsetCm: Math.round(avgOffset * 10) / 10
    },
    usefulStats: [
      {
        label: messages.report.usefulStats.measuredTime,
        value: `${Math.round(session.durationMs / 1000)} s`
      },
      {
        label: messages.report.usefulStats.neutralPosture,
        value: `${Math.round(neutralRatio * 100)}%`,
        tone: neutralRatio >= 0.72 ? 'good' : neutralRatio >= 0.55 ? 'warn' : 'alert'
      },
      {
        label: messages.report.usefulStats.alertsEmitted,
        value: `${session.alerts.length}`,
        tone: session.alerts.length <= 2 ? 'good' : session.alerts.length <= 5 ? 'warn' : 'alert'
      },
      {
        label: messages.report.usefulStats.maxBadStreak,
        value: `${Math.round(longestBadStreakSec)} s`,
        tone:
          longestBadStreakSec <= 5
            ? 'good'
            : longestBadStreakSec <= 12
              ? 'warn'
              : 'alert'
      },
      {
        label: messages.report.usefulStats.averageLean,
        value: `${Math.round(avgLean)} deg`,
        tone: avgLean <= 8 ? 'good' : avgLean <= 12 ? 'warn' : 'alert'
      },
      {
        label: messages.report.usefulStats.trackingConfidence,
        value: `${Math.round(session.poseConfidence * 100)}%`,
        tone:
          session.poseConfidence >= 0.82
            ? 'good'
            : session.poseConfidence >= 0.68
              ? 'warn'
              : 'alert'
      }
    ],
    insights: [
      messages.report.insights.neutralRatio(Math.round(neutralRatio * 100)),
      messages.report.insights.longestBadStreak(Math.round(longestBadStreakSec)),
      messages.report.insights.dominantFocus(
        dominantIssue === 'balanced'
          ? messages.common.focusLabels.balanced
          : getIssueLabel(dominantIssue).toLowerCase()
      )
    ],
    issueBreakdown,
    recommendations
  };
}
