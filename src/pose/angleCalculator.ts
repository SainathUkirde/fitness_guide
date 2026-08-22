export interface Point2D {
  x: number;
  y: number;
  z?: number;
}

/**
 * Calculate angle at joint pointB, formed by pointA-pointB-pointC.
 * Returns degrees (0-180).
 */
export function calculateAngle(
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D
): number {
  const radians =
    Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

/**
 * Calculate the Euclidean distance between two points.
 */
export function distanceBetween(a: Point2D, b: Point2D): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Normalize a value within a range to 0-100.
 */
export function normalizeToScore(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  const clamped = Math.max(min, Math.min(max, value));
  const score = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - score : score;
}
