import type { PoseLandmarkName, PostureThresholds } from '@/domain/posture/types';
import { messages } from '@/translations';

export const POSE_LANDMARK_NAMES: PoseLandmarkName[] = [
  'nose',
  'leftEyeInner',
  'leftEye',
  'leftEyeOuter',
  'rightEyeInner',
  'rightEye',
  'rightEyeOuter',
  'leftEar',
  'rightEar',
  'mouthLeft',
  'mouthRight',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftPinky',
  'rightPinky',
  'leftIndex',
  'rightIndex',
  'leftThumb',
  'rightThumb',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
  'leftHeel',
  'rightHeel',
  'leftFootIndex',
  'rightFootIndex'
];

export const POSE_CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 29],
  [29, 31],
  [28, 30],
  [30, 32]
];

export const MEDIAPIPE_VERSION = '0.10.34';
export const WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export const LIVE_SMOOTHING_WINDOW = 12;
export const TRACKING_SCORE_THRESHOLD = 0.55;
export const BASELINE_CAPTURE_MS = 1600;
export const DEFAULT_ALERT_INTERVAL_MS = 10000;
export const DEFAULT_INFERENCE_STRIDE = 2;
export const HISTORY_STORAGE_KEY = 'posture-checker-history-v3';
export const DEFAULT_REPORT_TITLE = messages.hook.defaultReportTitle;

export const DEFAULT_POSTURE_THRESHOLDS: PostureThresholds = {
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
};
