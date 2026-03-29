'use client';

import type { SavedSessionRecord } from '@/domain/session-history/types';
import { messages } from '@/translations';
import { SessionTimelineChart } from '@/ui/components/session-timeline-chart';
import { Badge } from '@/ui/components/ui/badge';
import { Button } from '@/ui/components/ui/button';
import { Panel } from '@/ui/components/ui/panel';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(messages.locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toneFromScore(score: number) {
  if (score >= 85) {
    return 'good' as const;
  }

  if (score >= 70) {
    return 'warn' as const;
  }

  return 'alert' as const;
}

interface ReportModalProps {
  record: SavedSessionRecord;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export function ReportModal({
  record,
  onClose,
  onDownloadPdf
}: ReportModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ocean-950/80 px-4 py-6 backdrop-blur-md"
      role="presentation"
    >
      <Panel
        aria-labelledby="report-modal-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-y-auto bg-ocean-900/95 p-5 sm:p-6"
        role="dialog"
      >
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
              {messages.reportModal.titleLabel}
            </p>
            <h2
              className="font-display text-3xl font-semibold text-ink"
              id="report-modal-title"
            >
              {record.summary.title}
            </h2>
            <p className="text-sm leading-7 text-mist">
              {messages.reportModal.sessionSummary(
                formatDate(record.summary.startedAtIso),
                formatTime(record.summary.durationMs),
                record.report.overallScore
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onDownloadPdf} variant="primary">
              {messages.common.buttons.downloadPdf}
            </Button>
            <Button onClick={onClose}>{messages.common.buttons.close}</Button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <SessionTimelineChart timeline={record.timeline} />

          <div className="grid gap-4 lg:grid-cols-4">
            {[
              {
                label: messages.reportModal.scores.overall.label,
                detail: messages.reportModal.scores.overall.detail,
                value: record.report.overallScore
              },
              {
                label: messages.reportModal.scores.posture.label,
                detail: messages.reportModal.scores.posture.detail,
                value: record.report.postureScore
              },
              {
                label: messages.reportModal.scores.stability.label,
                detail: messages.reportModal.scores.stability.detail,
                value: record.report.stabilityScore
              },
              {
                label: messages.reportModal.scores.recovery.label,
                detail: messages.reportModal.scores.recovery.detail,
                value: record.report.recoveryScore
              }
            ].map((item) => (
              <Panel className="space-y-3 p-5" key={item.label}>
                <Badge tone={toneFromScore(item.value)}>{item.label}</Badge>
                <strong className="block font-display text-4xl font-semibold text-ink">
                  {item.value}
                </strong>
                <p className="text-sm leading-7 text-mist">{item.detail}</p>
              </Panel>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="space-y-4">
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                {messages.reportModal.usefulStats}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {record.report.usefulStats.map((stat) => (
                  <div
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                    key={stat.label}
                  >
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                      {stat.label}
                    </p>
                    <strong className="mt-2 block font-display text-2xl font-semibold text-ink">
                      {stat.value}
                    </strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="space-y-4">
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                {messages.reportModal.issueBreakdown}
              </p>
              <div className="space-y-3">
                {record.report.issueBreakdown.map((issue) => (
                  <div
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-start sm:justify-between"
                    key={issue.kind}
                  >
                    <div>
                      <strong className="block text-sm text-ink">{issue.label}</strong>
                      <p className="mt-2 text-sm leading-7 text-mist">
                        {messages.reportModal.affectedTime(issue.affectedPercent)}
                      </p>
                    </div>
                    <Badge tone={issue.severity === 'high' ? 'alert' : issue.severity === 'medium' ? 'warn' : 'good'}>
                      {messages.reportModal.excess(issue.averageExcess)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="space-y-4">
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                {messages.reportModal.insights}
              </p>
              <div className="space-y-3">
                {record.report.insights.map((insight) => (
                  <p
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-mist"
                    key={insight}
                  >
                    {insight}
                  </p>
                ))}
              </div>
            </Panel>

            <Panel className="space-y-4">
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                {messages.reportModal.recommendations}
              </p>
              <div className="space-y-3">
                {record.report.recommendations.map((recommendation) => (
                  <div
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                    key={recommendation.id}
                  >
                    <Badge
                      tone={
                        recommendation.severity === 'high'
                          ? 'alert'
                          : recommendation.severity === 'medium'
                            ? 'warn'
                            : 'good'
                      }
                    >
                      {messages.common.focusLabels[recommendation.focus]}
                    </Badge>
                    <strong className="mt-3 block text-sm text-ink">
                      {recommendation.title}
                    </strong>
                    <p className="mt-2 text-sm leading-7 text-mist">
                      {recommendation.detail}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </Panel>
    </div>
  );
}
