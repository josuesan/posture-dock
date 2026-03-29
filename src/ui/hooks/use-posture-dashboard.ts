'use client';

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from 'react';

import {
  DEFAULT_ALERT_INTERVAL_MS,
  DEFAULT_INFERENCE_STRIDE,
  DEFAULT_POSTURE_THRESHOLDS,
  DEFAULT_REPORT_TITLE,
  POSE_CONNECTIONS
} from '@/domain/posture/constants';
import type {
  CameraOption,
  LiveTrackingState,
  PostureThresholds,
  TrackingSettings
} from '@/domain/posture/types';
import { analyzeSession } from '@/domain/posture/report';
import { createSessionRecorder, extractPoseSnapshot } from '@/domain/posture/session-recorder';
import type { AuthUser } from '@/domain/auth/types';
import type { SavedSessionRecord } from '@/domain/session-history/types';
import { buildSavedSessionRecord } from '@/application/use-cases/build-saved-session-record';
import {
  deleteSessionRecord,
  loadSessionHistory,
  saveSessionRecord
} from '@/application/use-cases/session-history-service';
import { SupabaseAuthGateway } from '@/infrastructure/auth/supabase-auth-gateway';
import { CompositeSessionHistoryRepository } from '@/infrastructure/persistence/composite-session-history-repository';
import { MediaPipePoseEngine } from '@/infrastructure/pose/mediapipe-pose-engine';
import { downloadReportPdf } from '@/infrastructure/report/jspdf-report-exporter';
import { messages } from '@/translations';

type CameraState =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'blocked'
  | 'unsupported'
  | 'loading-model'
  | 'tracking'
  | 'error';

type ZoomRange = {
  min: number;
  max: number;
  step: number;
};

type SyncState = 'idle' | 'local-only' | 'synced' | 'local-failed';

const EMPTY_TRACKING_STATE: LiveTrackingState = {
  elapsedMs: 0,
  durationMs: null,
  progressPercent: null,
  isSessionRunning: false,
  isUsingLiveData: false,
  poseConfidence: 0,
  torsoLeanDeg: 0,
  shoulderLiftDeg: 0,
  shoulderSlopeDeg: 0,
  headForwardCm: 0,
  torsoOffsetXCm: 0,
  activeIssues: [],
  lastAlert: null,
  engineMessage: messages.hook.initialEngineMessage
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getTodaySummary(records: SavedSessionRecord[]) {
  const today = startOfToday();
  const todayRecords = records.filter(
    (record) => new Date(record.summary.startedAtIso).getTime() >= today
  );
  const totalTrackingTime = todayRecords.reduce(
    (sum, record) => sum + record.summary.durationMs,
    0
  );
  const badPostureTime = todayRecords.reduce(
    (sum, record) => sum + record.report.badPostureTimeMs,
    0
  );
  const postureAverage = todayRecords.length
    ? Math.round(
        todayRecords.reduce((sum, record) => sum + record.report.overallScore, 0) /
          todayRecords.length
      )
    : 0;

  return {
    totalTrackingTime,
    badPostureTime,
    badPosturePercent:
      totalTrackingTime > 0
        ? Math.round((badPostureTime / totalTrackingTime) * 1000) / 10
        : 0,
    sessionCount: todayRecords.length,
    postureAverage
  };
}

function buildThresholds(
  leanWarnDeg: number,
  headForwardWarnCm: number,
  torsoOffsetWarnCm: number
): PostureThresholds {
  return {
    ...DEFAULT_POSTURE_THRESHOLDS,
    leanWarnDeg,
    leanHighDeg: Math.round(leanWarnDeg * 1.6),
    headForwardWarnCm,
    headForwardHighCm: Math.round(headForwardWarnCm * 1.65),
    torsoOffsetWarnCm,
    torsoOffsetHighCm: Math.round(torsoOffsetWarnCm * 1.6)
  };
}

function getCameraLabel(
  selectedCameraId: string,
  cameraOptions: CameraOption[]
): string {
  return (
    cameraOptions.find((camera) => camera.deviceId === selectedCameraId)?.label ??
    messages.common.cameraDefault
  );
}

export function usePostureDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseEngineRef = useRef<MediaPipePoseEngine | null>(null);
  const frameCounterRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const authGatewayRef = useRef(new SupabaseAuthGateway());
  const historyRepositoryRef = useRef(new CompositeSessionHistoryRepository());
  const recorderRef = useRef(
    createSessionRecorder({
        title: DEFAULT_REPORT_TITLE,
        settings: {
          cameraDeviceId: null,
          cameraLabel: messages.common.cameraDefault,
          zoom: null,
          soundEnabled: true,
          alertCooldownMs: DEFAULT_ALERT_INTERVAL_MS,
        inferenceStride: DEFAULT_INFERENCE_STRIDE,
        thresholds: DEFAULT_POSTURE_THRESHOLDS
      }
    })
  );
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [availableCameras, setAvailableCameras] = useState<CameraOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
  const [zoomValue, setZoomValue] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertCooldownMs, setAlertCooldownMs] = useState(DEFAULT_ALERT_INTERVAL_MS);
  const [inferenceStride, setInferenceStride] = useState(DEFAULT_INFERENCE_STRIDE);
  const [leanWarnDeg, setLeanWarnDeg] = useState(
    DEFAULT_POSTURE_THRESHOLDS.leanWarnDeg
  );
  const [headForwardWarnCm, setHeadForwardWarnCm] = useState(
    DEFAULT_POSTURE_THRESHOLDS.headForwardWarnCm
  );
  const [torsoOffsetWarnCm, setTorsoOffsetWarnCm] = useState(
    DEFAULT_POSTURE_THRESHOLDS.torsoOffsetWarnCm
  );
  const [trackingState, setTrackingState] = useState(EMPTY_TRACKING_STATE);
  const [engineMessage, setEngineMessage] = useState<string>(
    messages.hook.initialEngineMessage
  );
  const [history, setHistory] = useState<SavedSessionRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<SavedSessionRecord | null>(null);
  const [latestRecordId, setLatestRecordId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState<string>(
    messages.hook.loadingPersistence
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authBusyLabel, setAuthBusyLabel] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [lastMagicLinkEmail, setLastMagicLinkEmail] = useState('');

  const thresholds = buildThresholds(
    leanWarnDeg,
    headForwardWarnCm,
    torsoOffsetWarnCm
  );
  const isReady = cameraState === 'ready';
  const isTracking = cameraState === 'tracking';
  const canRetry = cameraState !== 'tracking' && cameraState !== 'loading-model';
  const todaySummary = getTodaySummary(history);
  const authAvailable = authGatewayRef.current.isAvailable();
  const latestRecord =
    history.find((record) => record.summary.id === latestRecordId) ?? null;

  const reloadHistory = useEffectEvent(async (user: AuthUser | null) => {
    const records = await loadSessionHistory(historyRepositoryRef.current, user);
    setHistory(records);
  });

  const refreshCameraList = useEffectEvent(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices
      .filter((device) => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || messages.common.cameraFallback(index)
      }));

    setAvailableCameras(cameras);

    if (!selectedCameraId && cameras[0]) {
      setSelectedCameraId(cameras[0].deviceId);
    }
  });

  const buildTrackingSettings = useEffectEvent((): TrackingSettings => ({
    cameraDeviceId: selectedCameraId || null,
    cameraLabel: getCameraLabel(selectedCameraId, availableCameras),
    zoom: zoomRange ? zoomValue : null,
    soundEnabled,
    alertCooldownMs,
    inferenceStride,
    thresholds
  }));

  const playAlertTone = useEffectEvent(() => {
    if (!soundEnabled) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;

    if (context.state === 'suspended') {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 720;
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
  });

  const drawFrameOverlay = useEffectEvent((frame: import('@/domain/posture/types').PoseFrame) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    canvas.width = frame.width;
    canvas.height = frame.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(109, 199, 182, 0.92)';
    context.fillStyle = 'rgba(255, 187, 92, 0.94)';

    POSE_CONNECTIONS.forEach(([fromIndex, toIndex]) => {
      const from = frame.keypoints[fromIndex];
      const to = frame.keypoints[toIndex];

      if (!from || !to || from.score < 0.45 || to.score < 0.45) {
        return;
      }

      context.beginPath();
      context.moveTo(from.x * frame.width, from.y * frame.height);
      context.lineTo(to.x * frame.width, to.y * frame.height);
      context.stroke();
    });

    frame.keypoints.forEach((keypoint) => {
      if (keypoint.score < 0.45) {
        return;
      }

      context.beginPath();
      context.arc(
        keypoint.x * frame.width,
        keypoint.y * frame.height,
        4,
        0,
        Math.PI * 2
      );
      context.fill();
    });
  });

  const handlePoseFrame = useEffectEvent(
    (frame: import('@/domain/posture/types').PoseFrame) => {
      drawFrameOverlay(frame);

      if (!isTracking) {
        return;
      }

      frameCounterRef.current += 1;

      if (frameCounterRef.current % inferenceStride !== 0) {
        return;
      }

      const snapshot = extractPoseSnapshot(frame);

      if (!snapshot) {
        return;
      }

      recorderRef.current.consumeSnapshot(snapshot);
      const nextTrackingState = recorderRef.current.getTrackingState();
      setTrackingState({
        ...nextTrackingState,
        engineMessage:
          nextTrackingState.activeIssues.length > 0
            ? nextTrackingState.lastAlert?.message ??
              messages.hook.returnNeutral
            : messages.hook.postureStable
      });

      if (nextTrackingState.lastAlert?.timestampMs === snapshot.timestampMs) {
        playAlertTone();
      }
    }
  );

  const initializePoseEngine = useEffectEvent(async () => {
    if (!videoRef.current) {
      return;
    }

    if (!poseEngineRef.current) {
      poseEngineRef.current = new MediaPipePoseEngine();
    }

    setCameraState('loading-model');
    setEngineMessage(messages.hook.loadingModel);

    try {
      await poseEngineRef.current.start(videoRef.current, handlePoseFrame);
      setCameraState('ready');
      setEngineMessage(
        messages.hook.modelReady
      );
      setTrackingState((current) => ({
        ...current,
        engineMessage: messages.hook.modelReady
      }));
    } catch {
      setCameraState('error');
      setEngineMessage(messages.hook.modelLoadError);
    }
  });

  const applyZoom = useEffectEvent(async (nextZoom: number) => {
    const track = streamRef.current?.getVideoTracks()[0];

    if (!track || !zoomRange) {
      return;
    }

    try {
      await track.applyConstraints({
        advanced: [{ zoom: nextZoom } as MediaTrackConstraintSet]
      });
      setZoomValue(nextZoom);
    } catch {
      setSyncMessage(messages.hook.zoomRejected);
    }
  });

  const startCamera = useEffectEvent(async (deviceId?: string) => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraState('unsupported');

      return;
    }

    setCameraState('connecting');
    poseEngineRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setZoomRange(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          : {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await refreshCameraList();

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
        zoom?: { min: number; max: number; step?: number };
      };
      const settings = track.getSettings();

      if (capabilities.zoom) {
        const range = {
          min: capabilities.zoom.min,
          max: capabilities.zoom.max,
          step: capabilities.zoom.step ?? 0.1
        };
        setZoomRange(range);
        setZoomValue(typeof settings.zoom === 'number' ? settings.zoom : range.min);
      }
    } catch {
      setCameraState('blocked');
    }
  });

  const saveFinishedSession = useEffectEvent(async () => {
    const finishedSession = recorderRef.current.stop(performance.now());

    if (!finishedSession) {
      setCameraState('ready');
      setEngineMessage(messages.hook.notEnoughData);
      return;
    }

    const report = analyzeSession(finishedSession);
    const record = buildSavedSessionRecord(finishedSession, report);
    setCameraState('ready');
    setEngineMessage(messages.hook.sessionSaved);
    setTrackingState((current) => ({
      ...current,
      isSessionRunning: false,
      engineMessage: messages.hook.sessionSaved
    }));
    setLatestRecordId(record.summary.id);

    const persisted = await saveSessionRecord(
      historyRepositoryRef.current,
      record,
      authUser
    );
    startTransition(() => {
      setHistory(persisted.records);
    });

    if (persisted.syncState === 'synced') {
      setSyncState('synced');
      setSyncMessage(
        authUser
          ? messages.hook.syncSavedRemote
          : messages.hook.syncSavedPromptLogin
      );
    } else if (persisted.syncState === 'local-failed') {
      setSyncState('local-failed');
      setSyncMessage(
        persisted.error
          ? `Se guardo localmente, pero fallo Supabase: ${persisted.error}`
          : messages.hook.syncFailed
      );
    } else {
      setSyncState('local-only');
      setSyncMessage(
        authUser
          ? messages.hook.syncSavedLocalPending
          : messages.hook.syncSavedBrowser
      );
    }
  });

  const requestMagicLink = useEffectEvent(async () => {
    if (!authEmail) {
      return;
    }

    setAuthBusy(true);
    setAuthBusyLabel(messages.hook.auth.sendingLink);
    const result = await authGatewayRef.current.signInWithMagicLink(authEmail);
    setAuthBusy(false);
    setAuthBusyLabel('');
    if (!result.error) {
      setLastMagicLinkEmail(authEmail);
    }
    setAuthMessage(
      result.error
        ? result.error
        : messages.hook.auth.magicLinkCheckInbox
    );
  });

  const resendMagicLink = useEffectEvent(async () => {
    const targetEmail = authEmail || lastMagicLinkEmail;

    if (!targetEmail) {
      return;
    }

    setAuthBusy(true);
    setAuthBusyLabel(messages.hook.auth.resendLink);
    const result = await authGatewayRef.current.signInWithMagicLink(targetEmail);
    setAuthBusy(false);
    setAuthBusyLabel('');
    if (!result.error) {
      setLastMagicLinkEmail(targetEmail);
    }
    setAuthMessage(
      result.error
        ? result.error
        : messages.hook.auth.resentMagicLink(targetEmail)
    );
  });

  const signOut = useEffectEvent(async () => {
    setAuthBusy(true);
    setAuthBusyLabel(messages.hook.auth.signingOut);
    const result = await authGatewayRef.current.signOut();
    setAuthBusy(false);
    setAuthBusyLabel('');
    setAuthMessage(result.error ?? messages.hook.auth.signedOut);
  });

  const deleteRecord = useEffectEvent(async (recordId: string) => {
    const records = await deleteSessionRecord(
      historyRepositoryRef.current,
      recordId,
      authUser
    );
    setHistory(records);

    if (latestRecordId === recordId) {
      setLatestRecordId(null);
    }

    if (activeRecord?.summary.id === recordId) {
      setActiveRecord(null);
    }
  });

  useEffect(() => {
    void refreshCameraList();
    void startCamera();
    void authGatewayRef.current.getCurrentUser().then(async (user) => {
      setAuthUser(user);
      setSyncMessage(
        user
          ? messages.hook.status.activeUser(user.email ?? user.id)
          : authAvailable
            ? messages.hook.status.localModePrompt
            : messages.hook.status.localModeOnly
      );
      await reloadHistory(user);
    });

    const unsubscribe = authGatewayRef.current.onAuthStateChange(async (user) => {
      setAuthUser(user);
      setAuthMessage(
        user
          ? messages.hook.status.signedInAs(user.email ?? user.id)
          : messages.hook.status.remoteHistoryStopped
      );
      await reloadHistory(user);
    });

    return () => {
      unsubscribe();
      poseEngineRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      void audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    const handleLoadedData = () => {
      void initializePoseEngine();
    };

    videoElement.addEventListener('loadeddata', handleLoadedData);

    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [initializePoseEngine]);

  function startMeasurement() {
    if (!isReady) {
      return;
    }

    frameCounterRef.current = 0;
    recorderRef.current = createSessionRecorder({
      title: DEFAULT_REPORT_TITLE,
      settings: buildTrackingSettings()
    });
    recorderRef.current.start(performance.now());
    setCameraState('tracking');
    setTrackingState({
      ...EMPTY_TRACKING_STATE,
      isSessionRunning: true,
      engineMessage: messages.hook.tracking.sessionStarted
    });
    setEngineMessage(messages.hook.tracking.sessionStarted);

    if (soundEnabled && audioContextRef.current?.state === 'suspended') {
      void audioContextRef.current.resume();
    }
  }

  function resetMeasurement() {
    recorderRef.current.reset();
    frameCounterRef.current = 0;
    setActiveRecord(null);
    setCameraState('ready');
    setEngineMessage(messages.hook.tracking.modelReadyStartNew);
    setTrackingState({
      ...EMPTY_TRACKING_STATE,
      engineMessage: messages.hook.tracking.modelReadyStartNew
    });

    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  return {
    refs: {
      videoRef,
      canvasRef
    },
    state: {
      cameraState,
      availableCameras,
      selectedCameraId,
      zoomRange,
      zoomValue,
      soundEnabled,
      alertCooldownMs,
      inferenceStride,
      leanWarnDeg,
      headForwardWarnCm,
      torsoOffsetWarnCm,
      trackingState,
      engineMessage,
      history,
      activeRecord,
      latestRecord,
      syncState,
      syncMessage,
      authUser,
      authEmail,
      authBusy,
      authBusyLabel,
      authMessage,
      lastMagicLinkEmail,
      todaySummary,
      isReady,
      isTracking,
      canRetry,
      authAvailable
    },
    actions: {
      setSelectedCameraId,
      setZoomValue,
      setSoundEnabled,
      setAlertCooldownMs,
      setInferenceStride,
      setLeanWarnDeg,
      setHeadForwardWarnCm,
      setTorsoOffsetWarnCm,
      setAuthEmail,
      setActiveRecord,
      requestMagicLink,
      resendMagicLink,
      signOut,
      startCamera,
      applyZoom,
      startMeasurement,
      resetMeasurement,
      saveFinishedSession,
      deleteRecord,
      downloadReportPdf
    }
  };
}
