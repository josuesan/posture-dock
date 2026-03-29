import type {
  PostureIssue,
  Severity,
  TrackingSettings
} from '@/domain/posture/types';

export type ReportFocus = PostureIssue | 'habits';
export type MetricTone = 'good' | 'warn' | 'alert';
export type RecordSource = 'local' | 'supabase' | 'local+supabase';

export interface MetricStat {
  label: string;
  value: string;
  tone?: MetricTone;
}

export interface IssueBreakdown {
  kind: PostureIssue;
  label: string;
  affectedPercent: number;
  averageExcess: number;
  severity: Severity;
}

export interface PostureRecommendation {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  focus: ReportFocus;
}

export interface TimelinePoint {
  elapsedMs: number;
  leanDeg: number;
  headForwardCm: number;
  issueCount: number;
}

export interface PostureReport {
  overallScore: number;
  postureScore: number;
  stabilityScore: number;
  recoveryScore: number;
  focusScore: number;
  dominantIssue: PostureIssue | 'balanced';
  neutralPercent: number;
  badPostureTimeMs: number;
  longestBadStreakMs: number;
  alertCount: number;
  averages: {
    leanDeg: number;
    headForwardCm: number;
    shoulderLiftDeg: number;
    shoulderSlopeDeg: number;
    torsoOffsetCm: number;
  };
  usefulStats: MetricStat[];
  insights: string[];
  issueBreakdown: IssueBreakdown[];
  recommendations: PostureRecommendation[];
}

export interface SavedSessionSummary {
  id: string;
  title: string;
  durationMs: number;
  poseConfidence: number;
  startedAtIso: string;
  endedAtIso: string;
  notes: string;
  settings: TrackingSettings;
}

export interface SavedSessionRecord {
  summary: SavedSessionSummary;
  report: PostureReport;
  timeline: TimelinePoint[];
  source: RecordSource;
  syncedAtIso: string | null;
}
