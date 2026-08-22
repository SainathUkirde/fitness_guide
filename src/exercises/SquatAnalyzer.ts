import { calculateAngle, normalizeToScore } from '../pose/angleCalculator';
import { LANDMARK_INDICES, getLandmark, type NormalizedLandmark } from '../pose/landmarkUtils';

export type ExercisePhase = 'standing' | 'descending' | 'bottom' | 'ascending';

export interface AnalysisResult {
  repCount: number;
  phase: ExercisePhase | string;
  formScore: number;
  feedback: string;
  warnings: string[];
  jointAngles: Record<string, number>;
  movementQuality: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  riskReasons: string[];
  fatigueLevel: 'LOW' | 'MODERATE' | 'HIGH';
  subscores: {
    posture: number;
    rangeOfMotion: number;
    stability: number;
    symmetry: number;
    control: number;
  };
}

interface SquatState {
  phase: ExercisePhase;
  repCount: number;
  repHistory: number[]; // knee angles at bottom of each rep
  formErrors: string[];
  recentFormErrors: string[];
  lastRepTime: number;
  repDurations: number[];
  phaseStartTime: number;
  consecutiveBottomFrames: number;
}

const initialState = (): SquatState => ({
  phase: 'standing',
  repCount: 0,
  repHistory: [],
  formErrors: [],
  recentFormErrors: [],
  lastRepTime: 0,
  repDurations: [],
  phaseStartTime: Date.now(),
  consecutiveBottomFrames: 0,
});

let state: SquatState = initialState();

export function resetSquatAnalyzer() {
  state = initialState();
}

export function analyzeSquat(landmarks: NormalizedLandmark[]): AnalysisResult {
  const leftHip = getLandmark(landmarks, LANDMARK_INDICES.LEFT_HIP);
  const rightHip = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_HIP);
  const leftKnee = getLandmark(landmarks, LANDMARK_INDICES.LEFT_KNEE);
  const rightKnee = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_KNEE);
  const leftAnkle = getLandmark(landmarks, LANDMARK_INDICES.LEFT_ANKLE);
  const rightAnkle = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_ANKLE);
  const leftShoulder = getLandmark(landmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const rightShoulder = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_SHOULDER);

  const warnings: string[] = [];
  const feedback: string[] = [];

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return buildDefaultResult(state, ['Full body not visible. Move farther from camera.'], 'standing');
  }

  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  let leftHipAngle = 180;
  let rightHipAngle = 180;
  if (leftShoulder && rightShoulder) {
    leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
  }

  let torsoAngle = 0;
  if (leftShoulder && rightShoulder) {
    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    torsoAngle = Math.abs(Math.atan2(midShoulder.x - midHip.x, midHip.y - midShoulder.y) * (180 / Math.PI));
  }

  const kneeSymmetry = Math.abs(leftKneeAngle - rightKneeAngle);

  // State machine
  const prevPhase = state.phase;

  if (avgKneeAngle > 155) {
    if (prevPhase === 'ascending' || prevPhase === 'bottom') {
      // completed rep
      state.repCount++;
      const now = Date.now();
      if (state.lastRepTime > 0) {
        state.repDurations.push(now - state.lastRepTime);
        if (state.repDurations.length > 10) state.repDurations.shift();
      }
      state.lastRepTime = now;
      state.repHistory.push(avgKneeAngle);
    }
    state.phase = 'standing';
  } else if (avgKneeAngle > 100 && prevPhase === 'standing') {
    state.phase = 'descending';
  } else if (avgKneeAngle <= 100) {
    state.consecutiveBottomFrames++;
    if (state.consecutiveBottomFrames >= 2) {
      if (prevPhase !== 'bottom') state.phase = 'bottom';
    }
  } else if (avgKneeAngle > 100 && prevPhase === 'bottom') {
    state.phase = 'ascending';
    state.consecutiveBottomFrames = 0;
  }

  if (prevPhase !== state.phase) {
    state.consecutiveBottomFrames = 0;
  }

  // Form analysis
  const formWarnings: string[] = [];
  if (state.phase === 'bottom' || state.phase === 'ascending') {
    if (avgKneeAngle > 100) formWarnings.push('Shallow squat');
    if (torsoAngle > 35) formWarnings.push('Excessive forward lean');
  }
  if (kneeSymmetry > 20) formWarnings.push('Knee asymmetry detected');

  formWarnings.forEach((w) => {
    if (!state.formErrors.includes(w)) state.formErrors.push(w);
    if (!state.recentFormErrors.includes(w)) state.recentFormErrors.push(w);
    warnings.push(w);
  });

  // Feedback
  if (state.phase === 'standing') {
    feedback.push('Ready. Begin your squat.');
  } else if (state.phase === 'descending') {
    if (avgKneeAngle > 140) feedback.push('Keep descending...');
    else feedback.push('Good depth, hold briefly.');
  } else if (state.phase === 'bottom') {
    if (avgKneeAngle > 100) feedback.push('Go slightly deeper for best results.');
    else feedback.push('Great squat depth!');
  } else if (state.phase === 'ascending') {
    if (torsoAngle > 35) feedback.push('Keep your torso more upright.');
    else feedback.push('Drive through your heels to stand.');
  }

  // Scores
  const postureScore = normalizeToScore(torsoAngle, 0, 45, true);
  const romScore = normalizeToScore(avgKneeAngle, 60, 160, true); // lower = deeper = better
  const symmetryScore = normalizeToScore(kneeSymmetry, 0, 30, true);
  const stabilityScore = state.repCount > 0
    ? Math.min(100, 100 - state.recentFormErrors.length * 10)
    : 85;
  const controlScore = state.repDurations.length > 1
    ? normalizeToScore(
        Math.max(...state.repDurations) - Math.min(...state.repDurations),
        0, 2000, true
      )
    : 85;

  const formScore = Math.round(
    postureScore * 0.25 + romScore * 0.25 + symmetryScore * 0.2 + stabilityScore * 0.15 + controlScore * 0.15
  );

  const movementQuality = Math.round(
    formScore * 0.3 + romScore * 0.2 + stabilityScore * 0.2 + symmetryScore * 0.15 + controlScore * 0.15
  );

  // Risk
  const riskReasons: string[] = [];
  let riskScore = 0;
  if (torsoAngle > 35) { riskScore += 25; riskReasons.push('Excessive torso lean detected'); }
  if (avgKneeAngle > 110 && (state.phase === 'bottom')) { riskScore += 15; riskReasons.push('Limited range of motion'); }
  if (kneeSymmetry > 20) { riskScore += 20; riskReasons.push('Significant knee asymmetry'); }
  if (state.recentFormErrors.length >= 3) { riskScore += 20; riskReasons.push('Repeated form errors'); }
  if (riskScore === 0) riskReasons.push('Stable movement pattern', 'Consistent repetitions');

  const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' =
    riskScore <= 30 ? 'LOW' : riskScore <= 60 ? 'MODERATE' : 'HIGH';

  // Fatigue
  let fatigueLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (state.repCount >= 5) {
    const recent = state.repDurations.slice(-3);
    const early = state.repDurations.slice(0, 3);
    if (recent.length > 0 && early.length > 0) {
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgEarly = early.reduce((a, b) => a + b, 0) / early.length;
      const slowdown = (avgRecent - avgEarly) / avgEarly;
      if (slowdown > 0.3) fatigueLevel = 'HIGH';
      else if (slowdown > 0.15) fatigueLevel = 'MODERATE';
    }
  }

  // Clear recent errors periodically
  if (state.repCount % 5 === 0 && state.repCount > 0) {
    state.recentFormErrors = [];
  }

  return {
    repCount: state.repCount,
    phase: state.phase,
    formScore: Math.max(0, Math.min(100, formScore)),
    feedback: feedback[0] || 'Keep going!',
    warnings,
    jointAngles: {
      leftKnee: Math.round(leftKneeAngle),
      rightKnee: Math.round(rightKneeAngle),
      leftHip: Math.round(leftHipAngle),
      rightHip: Math.round(rightHipAngle),
      torso: Math.round(torsoAngle),
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

function buildDefaultResult(
  s: SquatState,
  warnings: string[],
  phase: string
): AnalysisResult {
  return {
    repCount: s.repCount,
    phase,
    formScore: 0,
    feedback: warnings[0] || 'Detecting pose...',
    warnings,
    jointAngles: {},
    movementQuality: 0,
    riskLevel: 'LOW',
    riskReasons: [],
    fatigueLevel: 'LOW',
    subscores: { posture: 0, rangeOfMotion: 0, stability: 0, symmetry: 0, control: 0 },
  };
}
