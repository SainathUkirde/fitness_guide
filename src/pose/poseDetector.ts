import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type { PoseLandmarkerResult };

let poseLandmarker: PoseLandmarker | null = null;
let initPromise: Promise<void> | null = null;
let loadError: string | null = null;

export async function initPoseDetector(): Promise<void> {
  // Already ready
  if (poseLandmarker) return;
  // Already loading — return the same promise so callers await the same init
  if (initPromise) return initPromise;

  loadError = null;
  initPromise = (async () => {
    try {
      // Pin to the exact installed package version to avoid CDN/WASM mismatch
      const pkgVersion = '1.0.1';
      const cdnBase = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${pkgVersion}/wasm`;
      const vision = await FilesetResolver.forVisionTasks(cdnBase);
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (err) {
      console.error('Failed to init pose detector:', err);
      loadError = 'Failed to load pose detection model. Check your internet connection.';
      initPromise = null; // allow retry
      throw err;
    }
  })();

  return initPromise;
}

export function getPoseLoadError(): string | null {
  return loadError;
}

export function isPoseDetectorReady(): boolean {
  return poseLandmarker !== null;
}

let lastVideoTime = -1;

export function detectPose(
  video: HTMLVideoElement
): PoseLandmarkerResult | null {
  if (!poseLandmarker || video.readyState < 2) return null;
  const now = performance.now();
  if (video.currentTime === lastVideoTime) return null;
  lastVideoTime = video.currentTime;
  try {
    return poseLandmarker.detectForVideo(video, now);
  } catch {
    return null;
  }
}
