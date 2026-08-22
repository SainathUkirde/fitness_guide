import { calculateAngle, normalizeToScore } from '../pose/angleCalculator';
import { LANDMARK_INDICES, getLandmark, type NormalizedLandmark } from '../pose/landmarkUtils';
import type { AnalysisResult } from './SquatAnalyzer';

type PushUpPhase = 'top' | 'descending' | 'bottom' | 'ascending';

interface PushUpState {
  phase: PushUpPhase;
  repCount: number;
  formErrors: string[];
  recentFormErrors: string[];
  lastRepTime: number;
  repDurations: number[];
  consecutiveBottomFrames: number;
}

const initialState = (): PushUpState => ({
  phase: 'top',
  repCount: 0,
  formErrors: [],
  recentFormErrors: [],
  lastRepTime: 0,
  repDurations: [],
  consecutiveBottomFrames: 0,
});

let state: PushUpState = initialState();

export function resetPushUpAnalyzer() {
  state = initialState();
}

export function analyzePushUp(landmarks: NormalizedLandmark[]): AnalysisResult {
  const leftShoulder = getLandmark(landmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const rightShoulder = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_SHOULDER);
  const leftElbow = getLandmark(landmarks, LANDMARK_INDICES.LEFT_ELBOW);
  const rightElbow = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_ELBOW);
  const leftWrist = getLandmark(landmarks, LANDMARK_INDICES.LEFT_WRIST);
  const rightWrist = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_WRIST);
  const leftHip = getLandmark(landmarks, LANDMARK_INDICES.LEFT_HIP);
  const leftAnkle = getLandmark(landmarks, LANDMARK_INDICES.LEFT_ANKLE);

  if (!leftShoulder || !leftElbow || !leftWrist || !leftHip) {
    return buildDefaultResult(state, ['Upper body not fully visible.'], 'top');
  }

  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = rightShoulder && rightElbow && rightWrist
    ? calculateAngle(rightShoulder, rightElbow, rightWrist)
    : leftElbowAngle;
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  let bodyAlignment = 0;
  if (leftShoulder && leftHip && leftAnkle) {
    const expectedHipY = leftShoulder.y + (leftAnkle.y - leftShoulder.y) * 0.5;
    bodyAlignment = Math.abs(leftHip.y - expectedHipY) * 100;
  }

  const elbowSymmetry = Math.abs(leftElbowAngle - rightElbowAngle);

  const prevPhase = state.phase;

  if (avgElbowAngle > 155) {
    if (prevPhase === 'ascending' || prevPhase === 'bottom') {
      state.repCount++;
      const now = Date.now();
      if (state.lastRepTime > 0) {
        state.repDurations.push(now - state.lastRepTime);
        if (state.repDurations.length > 10) state.repDurations.shift();
      }
      state.lastRepTime = now;
    }
    state.phase = 'top';
    state.consecutiveBottomFrames = 0;
  } else if (avgElbowAngle > 90 && prevPhase === 'top') {
    state.phase = 'descending';
  } else if (avgElbowAngle <= 90) {
    state.consecutiveBottomFrames++;
    if (state.consecutiveBottomFrames >= 2) state.phase = 'bottom';
  } else if (avgElbowAngle > 90 && prevPhase === 'bottom') {
    state.phase = 'ascending';
    state.consecutiveBottomFrames = 0;
  }

  const warnings: string[] = [];
  const feedback: string[] = [];

  if (state.phase === 'bottom' || state.phase === 'ascending') {
    if (avgElbowAngle > 90) warnings.push('Insufficient depth');
    if (bodyAlignment > 8) warnings.push('Hip alignment issue');
  }
  if (elbowSymmetry > 20) warnings.push('Arm asymmetry detected');

  if (state.phase === 'top') feedback.push('Ready. Begin your push-up.');
  else if (state.phase === 'descending') feedback.push('Lower your body with control.');
  else if (state.phase === 'bottom') {
    if (avgElbowAngle > 90) feedback.push('Lower your body further.');
    else if (bodyAlignment > 8) feedback.push('Keep your hips aligned with your body.');
    else feedback.push('Great depth!');
  } else if (state.phase === 'ascending') {
    if (bodyAlignment > 8) feedback.push('Keep your hips aligned.');
    else feedback.push('Push up through your chest.');
  }

  warnings.forEach((w) => {
    if (!state.formErrors.includes(w)) state.formErrors.push(w);
    if (!state.recentFormErrors.includes(w)) state.recentFormErrors.push(w);
  });

  const postureScore = normalizeToScore(bodyAlignment, 0, 15, true);
  const romScore = normalizeToScore(avgElbowAngle, 60, 160, true);
  const symmetryScore = normalizeToScore(elbowSymmetry, 0, 30, true);
  const stabilityScore = Math.min(100, 100 - state.recentFormErrors.length * 10);
  const controlScore = state.repDurations.length > 1
    ? normalizeToScore(Math.max(...state.repDurations) - Math.min(...state.repDurations), 0, 2000, true)
    : 85;

  const formScore = Math.round(postureScore * 0.3 + romScore * 0.25 + symmetryScore * 0.2 + stabilityScore * 0.15 + controlScore * 0.1);
  const movementQuality = Math.round(formScore * 0.3 + romScore * 0.2 + stabilityScore * 0.2 + symmetryScore * 0.15 + controlScore * 0.15);

  const riskReasons: string[] = [];
  let riskScore = 0;
  if (bodyAlignment > 8) { riskScore += 25; riskReasons.push('Poor body alignment (hip sag or pike)'); }
  if (avgElbowAngle > 100 && state.phase === 'bottom') { riskScore += 15; riskReasons.push('Limited range of motion'); }
  if (elbowSymmetry > 20) { riskScore += 20; riskReasons.push('Significant arm asymmetry'); }
  if (state.recentFormErrors.length >= 3) { riskScore += 20; riskReasons.push('Repeated form errors'); }
  if (riskScore === 0) { riskReasons.push('Good body alignment', 'Consistent depth'); }

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
    jointAngles: { leftElbow: Math.round(leftElbowAngle), rightElbow: Math.round(rightElbowAngle), bodyAlignment: Math.round(bodyAlignment) },
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

function buildDefaultResult(s: PushUpState, warnings: string[], phase: string): AnalysisResult {
  return {
    repCount: s.repCount, phase, formScore: 0, feedback: warnings[0] || 'Detecting pose...',
    warnings, jointAngles: {}, movementQuality: 0, riskLevel: 'LOW', riskReasons: [],
    fatigueLevel: 'LOW', subscores: { posture: 0, rangeOfMotion: 0, stability: 0, symmetry: 0, control: 0 },
  };
}
