import {
  BASELINE_CAPTURE_MS,
  LIVE_SMOOTHING_WINDOW,
  TRACKING_SCORE_THRESHOLD
} from '@/domain/posture/constants';
import type {
  AlertEvent,
  ExtractedPoseSnapshot,
  IssueSignal,
  PoseFrame,
  PoseKeypoint,
  PostureIssue,
  PostureSample,
  PostureSession,
  PostureThresholds,
  SessionRecorder,
  SessionRecorderOptions,
  Severity
} from '@/domain/posture/types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createKeypointMap(
  keypoints: PoseKeypoint[]
): Map<PoseKeypoint['name'], PoseKeypoint> {
  return new Map(keypoints.map((keypoint) => [keypoint.name, keypoint]));
}

function buildSeverity(
  value: number,
  warnThreshold: number,
  highThreshold: number
): Severity | null {
  if (value >= highThreshold) {
    return 'high';
  }

  if (value >= warnThreshold) {
    return 'medium';
  }

  return null;
}

function buildIssueSignals(
  sample: Omit<PostureSample, 'issues'>,
  thresholds: PostureThresholds
): IssueSignal[] {
  const issues: IssueSignal[] = [];

  if (sample.trackingConfidence < TRACKING_SCORE_THRESHOLD) {
    return issues;
  }

  const leanSeverity = buildSeverity(
    sample.torsoLeanDeg,
    thresholds.leanWarnDeg,
    thresholds.leanHighDeg
  );

  if (leanSeverity) {
    issues.push({
      kind: 'lean',
      label: 'Torso demasiado inclinado',
      value: sample.torsoLeanDeg,
      threshold: thresholds.leanWarnDeg,
      severity: leanSeverity
    });
  }

  const headSeverity = buildSeverity(
    sample.headForwardCm,
    thresholds.headForwardWarnCm,
    thresholds.headForwardHighCm
  );

  if (headSeverity) {
    issues.push({
      kind: 'headForward',
      label: 'Cabeza adelantada',
      value: sample.headForwardCm,
      threshold: thresholds.headForwardWarnCm,
      severity: headSeverity
    });
  }

  const shoulderLiftSeverity = buildSeverity(
    sample.shoulderLiftDeg,
    thresholds.shoulderLiftWarnDeg,
    thresholds.shoulderLiftHighDeg
  );
  const shoulderSlopeSeverity = buildSeverity(
    sample.shoulderSlopeDeg,
    thresholds.shoulderSlopeWarnDeg,
    thresholds.shoulderSlopeHighDeg
  );
  const shoulderSeverity =
    shoulderLiftSeverity === 'high' || shoulderSlopeSeverity === 'high'
      ? 'high'
      : shoulderLiftSeverity || shoulderSlopeSeverity;

  if (shoulderSeverity) {
    const liftDominates = sample.shoulderLiftDeg >= sample.shoulderSlopeDeg;
    issues.push({
      kind: 'shoulders',
      label: liftDominates ? 'Hombros elevados' : 'Hombros desnivelados',
      value: liftDominates ? sample.shoulderLiftDeg : sample.shoulderSlopeDeg,
      threshold: liftDominates
        ? thresholds.shoulderLiftWarnDeg
        : thresholds.shoulderSlopeWarnDeg,
      severity: shoulderSeverity
    });
  }

  const offsetSeverity = buildSeverity(
    Math.abs(sample.torsoOffsetXCm),
    thresholds.torsoOffsetWarnCm,
    thresholds.torsoOffsetHighCm
  );

  if (offsetSeverity) {
    issues.push({
      kind: 'offCenter',
      label: 'Torso desplazado de la linea base',
      value: Math.abs(sample.torsoOffsetXCm),
      threshold: thresholds.torsoOffsetWarnCm,
      severity: offsetSeverity
    });
  }

  return issues.sort((left, right) => {
    const severityWeight = { high: 3, medium: 2, low: 1 };
    return severityWeight[right.severity] - severityWeight[left.severity];
  });
}

function buildAlertMessage(issue: IssueSignal): string {
  switch (issue.kind) {
    case 'lean':
      return 'Endereza el torso y vuelve a apilar pecho sobre pelvis.';
    case 'headForward':
      return 'Trae la cabeza hacia atras y alinea la mirada con la pantalla.';
    case 'shoulders':
      return 'Baja los hombros y suelta tension en cuello y trapecio.';
    case 'offCenter':
      return 'Reparte el peso y vuelve al centro de la silla.';
  }
}

function normalizeSample(
  snapshot: ExtractedPoseSnapshot,
  window: ExtractedPoseSnapshot[],
  baselineTorsoXcm: number,
  thresholds: PostureThresholds
): PostureSample {
  const torsoCenterXcm = average(window.map((item) => item.torsoCenterXcm));
  const sample: Omit<PostureSample, 'issues'> = {
    timestampMs: snapshot.timestampMs,
    trackingConfidence: average(window.map((item) => item.trackingConfidence)),
    torsoLeanDeg: average(window.map((item) => item.torsoLeanDeg)),
    shoulderLiftDeg: average(window.map((item) => item.shoulderLiftDeg)),
    shoulderSlopeDeg: average(window.map((item) => item.shoulderSlopeDeg)),
    headForwardCm: average(window.map((item) => item.headForwardCm)),
    torsoCenterXcm,
    torsoOffsetXCm: torsoCenterXcm - baselineTorsoXcm
  };

  return {
    ...sample,
    issues: buildIssueSignals(sample, thresholds)
  };
}

export function extractPoseSnapshot(
  frame: PoseFrame
): ExtractedPoseSnapshot | null {
  const image = createKeypointMap(frame.keypoints);
  const world = createKeypointMap(frame.worldKeypoints);
  const requiredNames: Array<PoseKeypoint['name']> = [
    'nose',
    'leftEar',
    'rightEar',
    'leftShoulder',
    'rightShoulder',
    'leftHip',
    'rightHip'
  ];

  if (requiredNames.some((name) => !image.get(name) || !world.get(name))) {
    return null;
  }

  const leftShoulder = world.get('leftShoulder')!;
  const rightShoulder = world.get('rightShoulder')!;
  const leftHip = world.get('leftHip')!;
  const rightHip = world.get('rightHip')!;
  const nose = world.get('nose')!;
  const leftEar = image.get('leftEar')!;
  const rightEar = image.get('rightEar')!;
  const leftShoulderImage = image.get('leftShoulder')!;
  const rightShoulderImage = image.get('rightShoulder')!;
  const leftHipImage = image.get('leftHip')!;
  const rightHipImage = image.get('rightHip')!;

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2
  };
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2
  };

  const earMidY = (leftEar.y + rightEar.y) / 2;
  const shoulderMidY = (leftShoulderImage.y + rightShoulderImage.y) / 2;
  const hipMidY = (leftHipImage.y + rightHipImage.y) / 2;
  const torsoHeight = Math.max(0.12, hipMidY - shoulderMidY);
  const neckGapRatio = clamp((shoulderMidY - earMidY) / torsoHeight, 0, 1);
  const shoulderLiftDeg = clamp((0.34 - neckGapRatio) * 120, 0, 30);
  const shoulderSlopeDeg = toDegrees(
    Math.atan2(
      Math.abs(leftShoulderImage.y - rightShoulderImage.y),
      Math.max(Math.abs(leftShoulderImage.x - rightShoulderImage.x), 0.001)
    )
  );
  const torsoLeanDeg = toDegrees(
    Math.atan2(
      Math.abs(shoulderCenter.z - hipCenter.z),
      Math.abs(shoulderCenter.y - hipCenter.y)
    )
  );
  const headForwardCm = Math.max(0, (shoulderCenter.z - nose.z) * 100);
  const trackingConfidence = average(
    requiredNames.map((name) => image.get(name)!.score)
  );

  return {
    timestampMs: frame.timestampMs,
    trackingConfidence,
    torsoLeanDeg,
    shoulderLiftDeg,
    shoulderSlopeDeg,
    headForwardCm,
    torsoCenterXcm: shoulderCenter.x * 100
  };
}

export function createSessionRecorder(
  options: SessionRecorderOptions
): SessionRecorder {
  const { thresholds } = options.settings;
  const alertCooldownMs = options.settings.alertCooldownMs;

  let startTimeMs: number | null = null;
  let startWallClockIso: string | null = null;
  let rawSnapshots: ExtractedPoseSnapshot[] = [];
  let smoothedSnapshots: PostureSample[] = [];
  let confidenceSamples: number[] = [];
  let alerts: AlertEvent[] = [];
  let lastAlert: AlertEvent | null = null;
  let baselineSamples: number[] = [];
  let baselineTorsoXcm: number | null = null;
  let isSessionRunning = false;
  let lastAlertAt: Record<PostureIssue, number> = {
    lean: -Infinity,
    headForward: -Infinity,
    shoulders: -Infinity,
    offCenter: -Infinity
  };
  let previousIssueKinds = new Set<PostureIssue>();

  function reset() {
    startTimeMs = null;
    startWallClockIso = null;
    rawSnapshots = [];
    smoothedSnapshots = [];
    confidenceSamples = [];
    alerts = [];
    lastAlert = null;
    baselineSamples = [];
    baselineTorsoXcm = null;
    isSessionRunning = false;
    lastAlertAt = {
      lean: -Infinity,
      headForward: -Infinity,
      shoulders: -Infinity,
      offCenter: -Infinity
    };
    previousIssueKinds = new Set<PostureIssue>();
  }

  function start(startAtMs: number) {
    reset();
    startTimeMs = startAtMs;
    startWallClockIso = new Date().toISOString();
    isSessionRunning = true;
  }

  function maybeCalibrate(snapshot: ExtractedPoseSnapshot) {
    if (startTimeMs === null || baselineTorsoXcm !== null) {
      return;
    }

    if (snapshot.timestampMs - startTimeMs <= BASELINE_CAPTURE_MS) {
      baselineSamples.push(snapshot.torsoCenterXcm);
    }

    if (baselineSamples.length >= 12) {
      baselineTorsoXcm = average(baselineSamples);
    }
  }

  function maybeEmitAlerts(sample: PostureSample) {
    const activeKinds = new Set(sample.issues.map((issue) => issue.kind));

    sample.issues.forEach((issue) => {
      const isNewIssue = !previousIssueKinds.has(issue.kind);
      const enoughCooldown =
        sample.timestampMs - lastAlertAt[issue.kind] >= alertCooldownMs;

      if ((isNewIssue || issue.severity === 'high') && enoughCooldown) {
        lastAlert = {
          kind: issue.kind,
          timestampMs: sample.timestampMs,
          severity: issue.severity,
          message: buildAlertMessage(issue)
        };
        alerts.push(lastAlert);
        lastAlertAt[issue.kind] = sample.timestampMs;
      }
    });

    previousIssueKinds = activeKinds;
  }

  function consumeSnapshot(snapshot: ExtractedPoseSnapshot) {
    if (!isSessionRunning || startTimeMs === null) {
      return;
    }

    rawSnapshots.push(snapshot);
    confidenceSamples.push(snapshot.trackingConfidence);
    maybeCalibrate(snapshot);

    const smoothingWindow = rawSnapshots.slice(-LIVE_SMOOTHING_WINDOW);
    const stableBaseline = baselineTorsoXcm ?? average(baselineSamples);
    const normalized = normalizeSample(
      snapshot,
      smoothingWindow,
      stableBaseline || snapshot.torsoCenterXcm,
      thresholds
    );

    smoothedSnapshots.push(normalized);
    maybeEmitAlerts(normalized);
  }

  function stop(stopTimeMs: number): PostureSession | null {
    if (
      !isSessionRunning ||
      startTimeMs === null ||
      startWallClockIso === null ||
      smoothedSnapshots.length === 0
    ) {
      isSessionRunning = false;

      return null;
    }

    isSessionRunning = false;

    return {
      id: `posture-session-${Date.now()}`,
      title: options.title,
      durationMs: Math.max(0, Math.round(stopTimeMs - startTimeMs)),
      poseConfidence: average(confidenceSamples),
      snapshots: smoothedSnapshots,
      alerts,
      startedAtIso: startWallClockIso,
      endedAtIso: new Date().toISOString(),
      notes:
        'Sesion libre guardada desde webcam. El sistema usa heuristicas y no reemplaza una evaluacion medica o ergonomica profesional.',
      settings: options.settings
    };
  }

  function getTrackingState() {
    const latest = smoothedSnapshots.at(-1);
    const elapsedMs =
      startTimeMs === null ? 0 : Math.max(0, performance.now() - startTimeMs);

    return {
      elapsedMs,
      durationMs: null,
      progressPercent: null,
      isSessionRunning,
      isUsingLiveData: smoothedSnapshots.length > 0,
      poseConfidence: latest?.trackingConfidence ?? 0,
      torsoLeanDeg: latest?.torsoLeanDeg ?? 0,
      shoulderLiftDeg: latest?.shoulderLiftDeg ?? 0,
      shoulderSlopeDeg: latest?.shoulderSlopeDeg ?? 0,
      headForwardCm: latest?.headForwardCm ?? 0,
      torsoOffsetXCm: latest?.torsoOffsetXCm ?? 0,
      activeIssues: latest?.issues ?? [],
      lastAlert
    };
  }

  return {
    reset,
    start,
    stop,
    consumeSnapshot,
    getTrackingState
  };
}
