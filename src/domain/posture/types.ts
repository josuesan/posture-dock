export type PoseLandmarkName =
  | 'nose'
  | 'leftEyeInner'
  | 'leftEye'
  | 'leftEyeOuter'
  | 'rightEyeInner'
  | 'rightEye'
  | 'rightEyeOuter'
  | 'leftEar'
  | 'rightEar'
  | 'mouthLeft'
  | 'mouthRight'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftPinky'
  | 'rightPinky'
  | 'leftIndex'
  | 'rightIndex'
  | 'leftThumb'
  | 'rightThumb'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle'
  | 'leftHeel'
  | 'rightHeel'
  | 'leftFootIndex'
  | 'rightFootIndex';

export interface PoseKeypoint {
  name: PoseLandmarkName;
  x: number;
  y: number;
  z: number;
  score: number;
}

export interface PoseFrame {
  timestampMs: number;
  keypoints: PoseKeypoint[];
  worldKeypoints: PoseKeypoint[];
  width: number;
  height: number;
}

export interface PoseEngine {
  start(
    videoElement: HTMLVideoElement,
    onFrame: (frame: PoseFrame) => void
  ): Promise<void>;
  stop(): void;
}

export type PostureIssue = 'lean' | 'headForward' | 'shoulders' | 'offCenter';
export type Severity = 'high' | 'medium' | 'low';

export interface CameraOption {
  deviceId: string;
  label: string;
}

export interface PostureThresholds {
  leanWarnDeg: number;
  leanHighDeg: number;
  headForwardWarnCm: number;
  headForwardHighCm: number;
  shoulderLiftWarnDeg: number;
  shoulderLiftHighDeg: number;
  shoulderSlopeWarnDeg: number;
  shoulderSlopeHighDeg: number;
  torsoOffsetWarnCm: number;
  torsoOffsetHighCm: number;
}

export interface TrackingSettings {
  cameraDeviceId: string | null;
  cameraLabel: string;
  zoom: number | null;
  soundEnabled: boolean;
  alertCooldownMs: number;
  inferenceStride: number;
  thresholds: PostureThresholds;
}

export interface IssueSignal {
  kind: PostureIssue;
  label: string;
  value: number;
  threshold: number;
  severity: Severity;
}

export interface ExtractedPoseSnapshot {
  timestampMs: number;
  trackingConfidence: number;
  torsoLeanDeg: number;
  shoulderLiftDeg: number;
  shoulderSlopeDeg: number;
  headForwardCm: number;
  torsoCenterXcm: number;
}

export interface PostureSample extends ExtractedPoseSnapshot {
  torsoOffsetXCm: number;
  issues: IssueSignal[];
}

export interface AlertEvent {
  kind: PostureIssue;
  timestampMs: number;
  severity: Severity;
  message: string;
}

export interface LiveTrackingState {
  elapsedMs: number;
  durationMs: number | null;
  progressPercent: number | null;
  isSessionRunning: boolean;
  isUsingLiveData: boolean;
  poseConfidence: number;
  torsoLeanDeg: number;
  shoulderLiftDeg: number;
  shoulderSlopeDeg: number;
  headForwardCm: number;
  torsoOffsetXCm: number;
  activeIssues: IssueSignal[];
  lastAlert: AlertEvent | null;
  engineMessage: string;
}

export interface PostureSession {
  id: string;
  title: string;
  durationMs: number;
  poseConfidence: number;
  snapshots: PostureSample[];
  alerts: AlertEvent[];
  startedAtIso: string;
  endedAtIso: string;
  notes: string;
  settings: TrackingSettings;
}

export interface SessionRecorder {
  reset(): void;
  start(startTimeMs: number): void;
  stop(stopTimeMs: number): PostureSession | null;
  consumeSnapshot(snapshot: ExtractedPoseSnapshot): void;
  getTrackingState(): Omit<LiveTrackingState, 'engineMessage'>;
}

export interface SessionRecorderOptions {
  title: string;
  settings: TrackingSettings;
}
