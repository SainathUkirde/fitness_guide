import type { Point2D } from './angleCalculator';

// MediaPipe Pose landmark indices
export const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
};

export type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

// Skeleton connections for drawing
export const POSE_CONNECTIONS: [number, number][] = [
  [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.RIGHT_SHOULDER],
  [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_ELBOW],
  [LANDMARK_INDICES.LEFT_ELBOW, LANDMARK_INDICES.LEFT_WRIST],
  [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_ELBOW],
  [LANDMARK_INDICES.RIGHT_ELBOW, LANDMARK_INDICES.RIGHT_WRIST],
  [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_HIP],
  [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_HIP],
  [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP],
  [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.LEFT_KNEE],
  [LANDMARK_INDICES.LEFT_KNEE, LANDMARK_INDICES.LEFT_ANKLE],
  [LANDMARK_INDICES.RIGHT_HIP, LANDMARK_INDICES.RIGHT_KNEE],
  [LANDMARK_INDICES.RIGHT_KNEE, LANDMARK_INDICES.RIGHT_ANKLE],
  [LANDMARK_INDICES.LEFT_ANKLE, LANDMARK_INDICES.LEFT_HEEL],
  [LANDMARK_INDICES.RIGHT_ANKLE, LANDMARK_INDICES.RIGHT_HEEL],
  [LANDMARK_INDICES.LEFT_HEEL, LANDMARK_INDICES.LEFT_FOOT],
  [LANDMARK_INDICES.RIGHT_HEEL, LANDMARK_INDICES.RIGHT_FOOT],
];

export function getLandmark(
  landmarks: NormalizedLandmark[],
  index: number
): Point2D | null {
  const lm = landmarks[index];
  if (!lm || (lm.visibility !== undefined && lm.visibility < 0.3)) return null;
  return { x: lm.x, y: lm.y, z: lm.z };
}

export function getLandmarkRaw(
  landmarks: NormalizedLandmark[],
  index: number
): NormalizedLandmark | null {
  return landmarks[index] ?? null;
}

export function getPoseConfidence(landmarks: NormalizedLandmark[]): number {
  const keyIndices = [
    LANDMARK_INDICES.LEFT_SHOULDER,
    LANDMARK_INDICES.RIGHT_SHOULDER,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.RIGHT_HIP,
    LANDMARK_INDICES.LEFT_KNEE,
    LANDMARK_INDICES.RIGHT_KNEE,
  ];
  const visibilities = keyIndices.map(
    (i) => landmarks[i]?.visibility ?? 0
  );
  return visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
}

export function isFullBodyVisible(landmarks: NormalizedLandmark[]): boolean {
  const requiredIndices = [
    LANDMARK_INDICES.LEFT_SHOULDER,
    LANDMARK_INDICES.RIGHT_SHOULDER,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.RIGHT_HIP,
    LANDMARK_INDICES.LEFT_KNEE,
    LANDMARK_INDICES.RIGHT_KNEE,
    LANDMARK_INDICES.LEFT_ANKLE,
    LANDMARK_INDICES.RIGHT_ANKLE,
  ];
  return requiredIndices.every((i) => {
    const lm = landmarks[i];
    return lm && (lm.visibility === undefined || lm.visibility > 0.5);
  });
}

export function toPixelPoint(
  lm: NormalizedLandmark,
  width: number,
  height: number
): { x: number; y: number } {
  return { x: lm.x * width, y: lm.y * height };
}
