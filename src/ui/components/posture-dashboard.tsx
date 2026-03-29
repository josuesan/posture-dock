'use client';

import type { PostureIssue } from '@/domain/posture/types';
import { messages } from '@/translations';
import { AuthPanel } from '@/ui/components/auth-panel';
import { ReportModal } from '@/ui/components/report-modal';
import { SessionComparisonChart } from '@/ui/components/session-comparison-chart';
import { usePostureDashboard } from '@/ui/hooks/use-posture-dashboard';
import { Badge } from '@/ui/components/ui/badge';
import { Button } from '@/ui/components/ui/button';
import { Panel } from '@/ui/components/ui/panel';
import { cn } from '@/ui/lib/cn';

function issueLabel(kind: PostureIssue): string {
  return messages.common.issueLabels[kind];
}

function describeState(state: string, message: string): string {
  switch (state) {
    case 'ready':
      return messages.dashboard.descriptions.ready;
    case 'blocked':
      return messages.dashboard.descriptions.blocked;
    case 'unsupported':
      return messages.dashboard.descriptions.unsupported;
    case 'connecting':
      return messages.dashboard.descriptions.connecting;
    case 'loading-model':
      return messages.dashboard.descriptions.loadingModel;
    case 'tracking':
    case 'error':
      return message;
    default:
      return messages.dashboard.descriptions.idle;
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(messages.locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(iso));
}

function scoreTone(score: number): 'good' | 'warn' | 'alert' {
  if (score >= 85) {
    return 'good';
  }

  if (score >= 70) {
    return 'warn';
  }

  return 'alert';
}

function syncLabel(syncState: string): string {
  switch (syncState) {
    case 'synced':
      return messages.dashboard.syncLabels.synced;
    case 'local-failed':
      return messages.dashboard.syncLabels.localFailed;
    case 'local-only':
      return messages.dashboard.syncLabels.localOnly;
    default:
      return messages.dashboard.syncLabels.idle;
  }
}

function toneFromState(syncState: string): 'good' | 'warn' | 'neutral' {
  switch (syncState) {
    case 'synced':
      return 'good';
    case 'local-failed':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function PostureDashboard() {
  const { refs, state, actions } = usePostureDashboard();

  return (
    <>
      <section className="grid gap-5">
        <Panel className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                {messages.dashboard.sections.workspaceLabel}
              </p>
              <h2 className="font-display text-3xl font-semibold text-ink">
                {messages.dashboard.sections.workspaceTitle}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-mist">
                {messages.dashboard.sections.workspaceCopy}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={!state.canRetry}
                onClick={() => {
                  void actions.startCamera(state.selectedCameraId || undefined);
                }}
              >
                {messages.dashboard.buttons.retryCamera}
              </Button>
              <Button
                disabled={state.cameraState === 'loading-model'}
                onClick={actions.resetMeasurement}
              >
                {messages.common.buttons.reset}
              </Button>
              {state.isTracking ? (
                <Button onClick={actions.saveFinishedSession} variant="primary">
                  {messages.dashboard.buttons.stopAndSave}
                </Button>
              ) : (
                <Button
                  disabled={!state.isReady}
                  onClick={actions.startMeasurement}
                  variant="primary"
                >
                  {messages.dashboard.buttons.startRecording}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                {messages.dashboard.sessionStats.session}
              </p>
              <strong className="mt-2 block font-display text-3xl font-semibold text-ink">
                {state.isTracking
                  ? formatTime(state.trackingState.elapsedMs)
                  : state.isReady
                    ? messages.dashboard.scoreLabels.ready
                    : messages.dashboard.scoreLabels.preparing}
              </strong>
              <p className="mt-2 text-sm leading-7 text-mist">
                {state.isTracking
                  ? messages.dashboard.sessionStats.sessionActiveCopy
                  : messages.dashboard.sessionStats.sessionIdleCopy}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                {messages.dashboard.sessionStats.persistence}
              </p>
              <strong className="mt-2 block font-display text-3xl font-semibold text-ink">
                {syncLabel(state.syncState)}
              </strong>
              <p className="mt-2 text-sm leading-7 text-mist">{state.syncMessage}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                {messages.dashboard.sessionStats.today}
              </p>
              <strong className="mt-2 block font-display text-3xl font-semibold text-ink">
                {messages.dashboard.sessionStats.todaySessions(
                  state.todaySummary.sessionCount
                )}
              </strong>
              <p className="mt-2 text-sm leading-7 text-mist">
                {messages.dashboard.sessionStats.todayMeasured(
                  formatTime(state.todaySummary.totalTrackingTime)
                )}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                {messages.dashboard.sessionStats.latestScore}
              </p>
              <strong className="mt-2 block font-display text-3xl font-semibold text-ink">
                {state.latestRecord?.report.overallScore ??
                  messages.dashboard.sessionStats.latestScoreMissing}
              </strong>
              <p className="mt-2 text-sm leading-7 text-mist">
                {state.latestRecord
                  ? messages.dashboard.sessionStats.latestScoreDate(
                      formatDate(state.latestRecord.summary.startedAtIso)
                    )
                  : messages.dashboard.sessionStats.latestScoreEmpty}
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.72fr)]">
          <Panel className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                  {messages.dashboard.sections.mainViewLabel}
                </p>
                <h2 className="font-display text-3xl font-semibold text-ink">
                  {messages.dashboard.sections.mainViewTitle}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-mist">
                  {messages.dashboard.sections.mainViewCopy}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={toneFromState(state.syncState)}>
                  {syncLabel(state.syncState)}
                </Badge>
                <Badge tone="neutral">
                  {state.availableCameras.find(
                    (camera) => camera.deviceId === state.selectedCameraId
                  )?.label ?? messages.common.cameraDefault}
                </Badge>
              </div>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
              <video
                autoPlay
                className="absolute inset-0 size-full object-cover"
                muted
                playsInline
                ref={refs.videoRef}
              />
              <canvas className="absolute inset-0 size-full" ref={refs.canvasRef} />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
                <Badge tone="neutral">
                  {state.isTracking
                    ? messages.dashboard.live.activeSession
                    : messages.dashboard.live.preview}
                </Badge>
                {state.isTracking ? (
                  <Badge tone="alert">{messages.dashboard.live.recording}</Badge>
                ) : state.isReady ? (
                  <Badge tone="good">{messages.dashboard.live.modelReady}</Badge>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: messages.dashboard.metrics.torso,
                  value: `${Math.round(state.trackingState.torsoLeanDeg)} deg`
                },
                {
                  label: messages.dashboard.metrics.head,
                  value: `${Math.round(state.trackingState.headForwardCm)} cm`
                },
                {
                  label: messages.dashboard.metrics.shoulders,
                  value: `${Math.round(state.trackingState.shoulderLiftDeg)} deg`
                },
                {
                  label: messages.dashboard.metrics.tracking,
                  value: `${Math.round(state.trackingState.poseConfidence * 100)}%`
                }
              ].map((metric) => (
                <div
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                  key={metric.label}
                >
                  <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                    {metric.label}
                  </p>
                  <strong className="mt-2 block font-display text-2xl font-semibold text-ink">
                    {metric.value}
                  </strong>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div
                aria-live="polite"
                className={cn(
                  'rounded-[1.5rem] border p-5',
                  state.trackingState.activeIssues.length > 0
                    ? 'border-rose-300/20 bg-rose-400/10'
                    : 'border-teal-300/20 bg-teal-400/10'
                )}
                role="status"
              >
                <strong className="block text-sm text-ink">
                  {state.trackingState.activeIssues.length > 0
                    ? issueLabel(state.trackingState.activeIssues[0].kind)
                    : messages.dashboard.live.noAlerts}
                </strong>
                <p className="mt-2 text-sm leading-7 text-mist">
                  {state.trackingState.activeIssues.length > 0
                    ? state.trackingState.lastAlert?.message ??
                      messages.dashboard.live.issueFallback
                    : messages.dashboard.live.noAlertsCopy}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                  {messages.dashboard.sections.engineStateLabel}
                </p>
                <p className="mt-2 text-sm leading-7 text-mist">
                  {describeState(state.cameraState, state.engineMessage)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.trackingState.activeIssues.length > 0 ? (
                    state.trackingState.activeIssues.map((issue) => (
                      <Badge
                        key={issue.kind}
                        tone={
                          issue.severity === 'high'
                            ? 'alert'
                            : issue.severity === 'medium'
                              ? 'warn'
                              : 'good'
                        }
                      >
                        {issueLabel(issue.kind)}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="good">{messages.dashboard.live.stableTracking}</Badge>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid gap-5">
            <AuthPanel
              authAvailable={state.authAvailable}
              busyLabel={state.authBusyLabel}
              canResend={Boolean(state.authEmail || state.lastMagicLinkEmail)}
              email={state.authEmail}
              isBusy={state.authBusy}
              message={state.authMessage}
              onEmailChange={actions.setAuthEmail}
              onResend={() => {
                void actions.resendMagicLink();
              }}
              onSignIn={() => {
                void actions.requestMagicLink();
              }}
              onSignOut={() => {
                void actions.signOut();
              }}
              user={state.authUser}
            />

            <Panel className="space-y-5">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                  {messages.dashboard.sections.settingsLabel}
                </p>
                <h2 className="font-display text-3xl font-semibold text-ink">
                  {messages.dashboard.sections.settingsTitle}
                </h2>
              </div>

              <div className="space-y-5">
                <section className="space-y-4 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                      {messages.dashboard.controls.camera.title}
                    </p>
                    <p className="text-sm leading-7 text-mist">
                      {messages.dashboard.controls.camera.copy}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <label className="grid gap-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.camera.label}
                      </span>
                      <select
                        className="min-h-11 rounded-2xl border border-white/10 bg-ocean-950/70 px-4 text-sm text-ink outline-none focus:border-teal-300/40"
                        disabled={state.isTracking}
                        onChange={(event) => {
                          const nextCameraId = event.target.value;
                          actions.setSelectedCameraId(nextCameraId);
                          void actions.startCamera(nextCameraId || undefined);
                        }}
                        value={state.selectedCameraId}
                      >
                        {state.availableCameras.length === 0 ? (
                          <option value="">{messages.common.cameraDefault}</option>
                        ) : null}
                        {state.availableCameras.map((camera) => (
                          <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.camera.zoom(
                          state.zoomRange
                            ? state.zoomValue.toFixed(1)
                            : messages.common.unavailable
                        )}
                      </span>
                      <input
                        aria-label="Zoom de camara"
                        className="accent-sand-400"
                        disabled={!state.zoomRange || state.isTracking}
                        max={state.zoomRange?.max ?? 1}
                        min={state.zoomRange?.min ?? 1}
                        onChange={(event) => {
                          const nextZoom = Number(event.target.value);
                          actions.setZoomValue(nextZoom);
                          void actions.applyZoom(nextZoom);
                        }}
                        step={state.zoomRange?.step ?? 0.1}
                        type="range"
                        value={state.zoomValue}
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-4 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                      {messages.dashboard.controls.sensitivity.title}
                    </p>
                    <p className="text-sm leading-7 text-mist">
                      {messages.dashboard.controls.sensitivity.copy}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <label className="grid gap-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.sensitivity.lean(state.leanWarnDeg)}
                      </span>
                      <input
                        className="accent-sand-400"
                        max={20}
                        min={6}
                        onChange={(event) => actions.setLeanWarnDeg(Number(event.target.value))}
                        step={1}
                        type="range"
                        value={state.leanWarnDeg}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.sensitivity.head(
                          state.headForwardWarnCm
                        )}
                      </span>
                      <input
                        className="accent-sand-400"
                        max={12}
                        min={3}
                        onChange={(event) =>
                          actions.setHeadForwardWarnCm(Number(event.target.value))
                        }
                        step={1}
                        type="range"
                        value={state.headForwardWarnCm}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.sensitivity.offset(
                          state.torsoOffsetWarnCm
                        )}
                      </span>
                      <input
                        className="accent-sand-400"
                        max={18}
                        min={6}
                        onChange={(event) =>
                          actions.setTorsoOffsetWarnCm(Number(event.target.value))
                        }
                        step={1}
                        type="range"
                        value={state.torsoOffsetWarnCm}
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                      {messages.dashboard.controls.alerts.title}
                    </p>
                    <p className="text-sm leading-7 text-mist">
                      {messages.dashboard.controls.alerts.copy}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.alerts.interval}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {messages.dashboard.controls.alerts.intervals.map((option) => (
                          <Button
                            className={cn(
                              state.alertCooldownMs === option.value &&
                                'border-teal-300/30 bg-teal-400/12 text-ink'
                            )}
                            disabled={state.isTracking}
                            key={option.value}
                            onClick={() => actions.setAlertCooldownMs(option.value)}
                            size="sm"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <label className="grid gap-2">
                      <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                        {messages.dashboard.controls.alerts.inference}
                      </span>
                      <select
                        className="min-h-11 rounded-2xl border border-white/10 bg-ocean-950/70 px-4 text-sm text-ink outline-none focus:border-teal-300/40"
                        disabled={state.isTracking}
                        onChange={(event) =>
                          actions.setInferenceStride(Number(event.target.value))
                        }
                        value={state.inferenceStride}
                      >
                        {messages.dashboard.controls.alerts.inferenceOptions.map(
                          (option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <span className="text-sm text-ink">
                        {messages.dashboard.controls.alerts.sound}
                      </span>
                      <input
                        checked={state.soundEnabled}
                        className="size-4 accent-sand-400"
                        onChange={(event) => actions.setSoundEnabled(event.target.checked)}
                        type="checkbox"
                      />
                    </label>
                  </div>
                </section>
              </div>
            </Panel>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Panel className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                  {messages.dashboard.sections.todayLabel}
                </p>
                <h2 className="font-display text-3xl font-semibold text-ink">
                  {messages.dashboard.sections.todayTitle}
                </h2>
                <p className="text-sm leading-7 text-mist">
                  {messages.dashboard.sections.todayCopy}
                </p>
              </div>
              <Button
                disabled={!state.latestRecord}
                onClick={() => actions.setActiveRecord(state.latestRecord)}
              >
                {messages.dashboard.buttons.latestReport}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: messages.dashboard.today.totalTrackingTime,
                  value: formatTime(state.todaySummary.totalTrackingTime)
                },
                {
                  label: messages.dashboard.today.badPostureTime,
                  value: formatTime(state.todaySummary.badPostureTime)
                },
                {
                  label: messages.dashboard.today.badPosturePercentage,
                  value: `${state.todaySummary.badPosturePercent}%`
                },
                {
                  label: messages.dashboard.today.averageScore,
                  value: `${state.todaySummary.postureAverage}`
                }
              ].map((stat) => (
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

            <SessionComparisonChart records={state.history} />
          </Panel>

          <Panel className="space-y-5">
            <div className="space-y-2">
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
                {messages.dashboard.sections.historyLabel}
              </p>
              <h2 className="font-display text-3xl font-semibold text-ink">
                {messages.dashboard.sections.historyTitle}
              </h2>
              <p className="text-sm leading-7 text-mist">
                {messages.dashboard.sections.historyCopy}
              </p>
            </div>

            <div className="space-y-3">
              {state.history.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
                  <strong className="block text-sm text-ink">
                    {messages.dashboard.history.emptyTitle}
                  </strong>
                  <p className="mt-2 text-sm leading-7 text-mist">
                    {messages.dashboard.history.emptyCopy}
                  </p>
                </div>
              ) : (
                state.history.map((record) => (
                  <div
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                    key={record.summary.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm text-ink">
                            {formatDate(record.summary.startedAtIso)}
                          </strong>
                          <Badge tone="neutral">
                            {record.source === 'local+supabase'
                              ? messages.common.sessionSource.localSupabase
                              : record.source === 'supabase'
                                ? messages.common.sessionSource.supabase
                                : messages.common.sessionSource.local}
                          </Badge>
                        </div>
                        <p className="text-sm leading-7 text-mist">
                          {messages.dashboard.history.formatLine(
                            formatTime(record.summary.durationMs),
                            record.report.dominantIssue === 'balanced'
                              ? messages.common.focusLabels.balanced
                              : issueLabel(record.report.dominantIssue)
                          )}
                        </p>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-ocean-950/50 px-4 py-3 text-left sm:min-w-28 sm:text-center">
                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
                          {messages.dashboard.history.score}
                        </p>
                        <strong
                          className={cn(
                            'mt-2 block font-display text-3xl font-semibold',
                            scoreTone(record.report.overallScore) === 'good' &&
                              'text-teal-100',
                            scoreTone(record.report.overallScore) === 'warn' &&
                              'text-sand-100',
                            scoreTone(record.report.overallScore) === 'alert' &&
                              'text-rose-100'
                          )}
                        >
                          {record.report.overallScore}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => actions.setActiveRecord(record)}>
                        {messages.common.buttons.viewReport}
                      </Button>
                      <Button
                        onClick={() => {
                          void actions.downloadReportPdf(record);
                        }}
                      >
                        {messages.common.buttons.pdf}
                      </Button>
                      <Button
                        onClick={() => {
                          void actions.deleteRecord(record.summary.id);
                        }}
                        variant="subtle"
                      >
                        {messages.common.buttons.delete}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </section>

      {state.activeRecord ? (
        <ReportModal
          onClose={() => actions.setActiveRecord(null)}
          onDownloadPdf={() => {
            void actions.downloadReportPdf(state.activeRecord!);
          }}
          record={state.activeRecord}
        />
      ) : null}
    </>
  );
}
