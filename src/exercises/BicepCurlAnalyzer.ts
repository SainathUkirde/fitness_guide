import { calculateAngle, normalizeToScore } from '../pose/angleCalculator';
import { LANDMARK_INDICES, getLandmark, type NormalizedLandmark } from '../pose/landmarkUtils';
import type { AnalysisResult } from './SquatAnalyzer';

type CurlPhase = 'extended' | 'curling' | 'contracted' | 'extending';

interface CurlState {
  phase: CurlPhase;
  repCount: number;
  formErrors: string[];
  recentFormErrors: string[];
  lastRepTime: number;
  repDurations: number[];
  consecutiveTopFrames: number;
}

const initialState = (): CurlState => ({
  phase: 'extended',
  repCount: 0,
  formErrors: [],
  recentFormErrors: [],
  lastRepTime: 0,
  repDurations: [],
  consecutiveTopFrames: 0,
});

let state: CurlState = initialState();

export function resetBicepCurlAnalyzer() {
  state = initialState();
}

export function analyzeBicepCurl(landmarks: NormalizedLandmark[]): AnalysisResult {
  const leftShoulder = getLandmark(landmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const rightShoulder = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_SHOULDER);
  const leftElbow = getLandmark(landmarks, LANDMARK_INDICES.LEFT_ELBOW);
  const rightElbow = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_ELBOW);
  const leftWrist = getLandmark(landmarks, LANDMARK_INDICES.LEFT_WRIST);
  const rightWrist = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_WRIST);
  const leftHip = getLandmark(landmarks, LANDMARK_INDICES.LEFT_HIP);

  if (!leftShoulder || !leftElbow || !leftWrist) {
    return buildDefaultResult(state, ['Arms not visible.'], 'extended');
  }

  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = rightShoulder && rightElbow && rightWrist
    ? calculateAngle(rightShoulder, rightElbow, rightWrist)
    : leftElbowAngle;
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  // Upper arm swing detection
  let upperArmSwing = 0;
  if (leftShoulder && leftHip) {
    const baselineX = leftHip.x;
    upperArmSwing = Math.abs(leftShoulder.x - baselineX) * 100;
  }

  const elbowSymmetry = Math.abs(leftElbowAngle - rightElbowAngle);

  const prevPhase = state.phase;

  if (avgElbowAngle > 150) {
    if (prevPhase === 'extending' || prevPhase === 'contracted') {
      state.repCount++;
      const now = Date.now();
      if (state.lastRepTime > 0) {
        state.repDurations.push(now - state.lastRepTime);
        if (state.repDurations.length > 10) state.repDurations.shift();
      }
      state.lastRepTime = now;
    }
    state.phase = 'extended';
  } else if (avgElbowAngle > 60 && prevPhase === 'extended') {
    state.phase = 'curling';
  } else if (avgElbowAngle <= 60) {
    state.consecutiveTopFrames++;
    if (state.consecutiveTopFrames >= 2) state.phase = 'contracted';
  } else if (avgElbowAngle > 60 && prevPhase === 'contracted') {
    state.phase = 'extending';
    state.consecutiveTopFrames = 0;
  }

  if (prevPhase !== state.phase) state.consecutiveTopFrames = 0;

  const warnings: string[] = [];
  const feedback: string[] = [];

  if (upperArmSwing > 5) warnings.push('Excessive arm swing');
  if (elbowSymmetry > 20) warnings.push('Arm asymmetry');
  if (state.phase === 'extended' && prevPhase === 'extending' && avgElbowAngle < 140) {
    warnings.push('Incomplete extension');
  }

  if (state.phase === 'extended') feedback.push('Ready. Curl your arm up.');
  else if (state.phase === 'curling') {
    if (upperArmSwing > 5) feedback.push('Keep your upper arm stable.');
    else feedback.push('Curl upward with control.');
  } else if (state.phase === 'contracted') {
    feedback.push('Great! Now slowly lower the weight.');
  } else if (state.phase === 'extending') {
    feedback.push('Extend fully for complete range of motion.');
  }

  warnings.forEach((w) => {
    if (!state.formErrors.includes(w)) state.formErrors.push(w);
    if (!state.recentFormErrors.includes(w)) state.recentFormErrors.push(w);
  });

  const postureScore = normalizeToScore(upperArmSwing, 0, 10, true);
  const romScore = normalizeToScore(avgElbowAngle, 30, 160, true);
  const symmetryScore = normalizeToScore(elbowSymmetry, 0, 30, true);
  const stabilityScore = Math.min(100, 100 - state.recentFormErrors.length * 10);
  const controlScore = state.repDurations.length > 1
    ? normalizeToScore(Math.max(...state.repDurations) - Math.min(...state.repDurations), 0, 2000, true)
    : 85;

  const formScore = Math.round(postureScore * 0.25 + romScore * 0.25 + symmetryScore * 0.2 + stabilityScore * 0.15 + controlScore * 0.15);
  const movementQuality = Math.round(formScore * 0.3 + romScore * 0.2 + stabilityScore * 0.2 + symmetryScore * 0.15 + controlScore * 0.15);

  const riskReasons: string[] = [];
  let riskScore = 0;
  if (upperArmSwing > 5) { riskScore += 20; riskReasons.push('Upper arm instability/swinging'); }
  if (elbowSymmetry > 20) { riskScore += 20; riskReasons.push('Significant arm asymmetry'); }
  if (state.recentFormErrors.length >= 3) { riskScore += 20; riskReasons.push('Repeated form errors'); }
  if (riskScore === 0) riskReasons.push('Stable upper arm position', 'Good range of motion');

  const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = riskScore <= 30 ? 'LOW' : riskScore <= 60 ? 'MODERATE' : 'HIGH';
  let fatigueLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (state.repCount >= 5 && state.repDurations.length >= 4) {
    const recent = state.repDurations.slice(-2);
    const early = state.repDurations.slice(0, 2);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarly = early.reduce((a, b) => a + b, 0) / early.length;
    const slowdown = (avgRecent - avgEarly) / avgEarly;
    if (slowdown > 0.3) fatigueLevel = 'HIGH';
    else if (slowdown > 0.15) fatigueLevel = 'MODERATE';
  }

  return {
    repCount: state.repCount,
    phase: state.phase,
    formScore: Math.max(0, Math.min(100, formScore)),
    feedback: feedback[0] || 'Keep going!',
    warnings,
    jointAngles: {
      leftElbow: Math.round(leftElbowAngle),
      rightElbow: Math.round(rightElbowAngle),
      upperArmSwing: Math.round(upperArmSwing),
    },
    movementQuality: Math.max(0, Math.min(100, movementQuality)),
    riskLevel,
    riskReasons,
    fatigueLevel,
    subscores: {
      posture: Math.round(Math.max(0, Math.min(100, postureScore))),
      rangeOfMotion: Math.round(Math.max(0, Math.min(100, romScore))),
      stability: Math.round(Math.max(0, Math.min(100, stabilityScore))),
      symmetry: Math.round(Math.max(0, Math.min(100, symmetryScore))),
      control: Math.round(Math.max(0, Math.min(100, controlScore))),
    },
  };
}

function buildDefaultResult(s: CurlState, warnings: string[], phase: string): AnalysisResult {
  return {
    repCount: s.repCount, phase, formScore: 0, feedback: warnings[0] || 'Detecting pose...',
    warnings, jointAngles: {}, movementQuality: 0, riskLevel: 'LOW', riskReasons: [],
    fatigueLevel: 'LOW', subscores: { posture: 0, rangeOfMotion: 0, stability: 0, symmetry: 0, control: 0 },
  };
}
