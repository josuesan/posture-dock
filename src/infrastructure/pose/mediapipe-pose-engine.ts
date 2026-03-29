import type {
  Landmark,
  NormalizedLandmark,
  PoseLandmarker
} from '@mediapipe/tasks-vision';

import {
  MODEL_ASSET_PATH,
  POSE_LANDMARK_NAMES,
  WASM_ROOT
} from '@/domain/posture/constants';
import type { PoseEngine, PoseFrame, PoseKeypoint } from '@/domain/posture/types';

function mapKeypoints(
  landmarks: Array<NormalizedLandmark | Landmark> | undefined
): PoseKeypoint[] {
  if (!landmarks) {
    return [];
  }

  return landmarks.map((landmark, index) => ({
    name: POSE_LANDMARK_NAMES[index] ?? 'nose',
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    score: landmark.visibility ?? 0
  }));
}

export class MediaPipePoseEngine implements PoseEngine {
  private poseLandmarker: PoseLandmarker | null = null;
  private rafId: number | null = null;
  private lastVideoTime = -1;
  private isRunning = false;

  async start(
    videoElement: HTMLVideoElement,
    onFrame: (frame: PoseFrame) => void
  ): Promise<void> {
    const { FilesetResolver, PoseLandmarker } = await import(
      '@mediapipe/tasks-vision'
    );

    if (!this.poseLandmarker) {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.55,
        minPosePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55
      });
    }

    this.isRunning = true;

    const render = () => {
      if (!this.isRunning || !this.poseLandmarker) {
        return;
      }

      if (
        videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        videoElement.currentTime !== this.lastVideoTime
      ) {
        this.lastVideoTime = videoElement.currentTime;

        const result = this.poseLandmarker.detectForVideo(
          videoElement,
          performance.now()
        );
        const keypoints = mapKeypoints(result.landmarks[0]);
        const worldKeypoints = mapKeypoints(result.worldLandmarks[0]);

        if (keypoints.length > 0 && worldKeypoints.length > 0) {
          onFrame({
            timestampMs: performance.now(),
            keypoints,
            worldKeypoints,
            width: videoElement.videoWidth,
            height: videoElement.videoHeight
          });
        }
      }

      this.rafId = window.requestAnimationFrame(render);
    };

    this.rafId = window.requestAnimationFrame(render);
  }

  stop(): void {
    this.isRunning = false;
    this.lastVideoTime = -1;

    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
