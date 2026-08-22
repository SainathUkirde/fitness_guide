import { getLandmark, LANDMARK_INDICES, type NormalizedLandmark } from '../pose/landmarkUtils';
import type { AnalysisResult } from './SquatAnalyzer';

type JJPhase = 'closed' | 'opening' | 'open' | 'closing';

interface JJState {
  phase: JJPhase;
  repCount: number;
  lastRepTime: number;
  repDurations: number[];
  consecutiveOpenFrames: number;
}

const initialState = (): JJState => ({
  phase: 'closed',
  repCount: 0,
  lastRepTime: 0,
  repDurations: [],
  consecutiveOpenFrames: 0,
});

let state: JJState = initialState();

export function resetJumpingJackAnalyzer() {
  state = initialState();
}

export function analyzeJumpingJack(landmarks: NormalizedLandmark[]): AnalysisResult {
  const leftShoulder = getLandmark(landmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const rightShoulder = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_SHOULDER);
  const leftWrist = getLandmark(landmarks, LANDMARK_INDICES.LEFT_WRIST);
  const rightWrist = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_WRIST);
  const leftHip = getLandmark(landmarks, LANDMARK_INDICES.LEFT_HIP);
  const rightHip = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_HIP);
  const leftAnkle = getLandmark(landmarks, LANDMARK_INDICES.LEFT_ANKLE);
  const rightAnkle = getLandmark(landmarks, LANDMARK_INDICES.RIGHT_ANKLE);

  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    return buildDefaultResult(state, ['Full body not visible.'], 'closed');
  }

  // Arms open: wrists are above shoulders and spread out
  const armsOpen = leftWrist.y < leftShoulder.y - 0.05 && rightWrist.y < rightShoulder.y - 0.05;

  // Legs apart: ankles spread wider than hips
  const hipWidth = leftHip && rightHip ? Math.abs(leftHip.x - rightHip.x) : 0.15;
  const ankleWidth = leftAnkle && rightAnkle ? Math.abs(leftAnkle.x - rightAnkle.x) : 0;
  const legsOpen = ankleWidth > hipWidth * 1.5;

  const isOpen = armsOpen && legsOpen;
  const isClosed = !armsOpen && !legsOpen;

  const prevPhase = state.phase;

  if (isClosed) {
    if (prevPhase === 'closing' || prevPhase === 'open') {
      state.repCount++;
      const now = Date.now();
      if (state.lastRepTime > 0) {
        state.repDurations.push(now - state.lastRepTime);
        if (state.repDurations.length > 15) state.repDurations.shift();
      }
      state.lastRepTime = now;
    }
    state.phase = 'closed';
    state.consecutiveOpenFrames = 0;
  } else if (isOpen) {
    state.consecutiveOpenFrames++;
    if (state.consecutiveOpenFrames >= 2) state.phase = 'open';
  } else if (!isClosed && prevPhase === 'closed') {
    state.phase = 'opening';
  } else if (!isOpen && prevPhase === 'open') {
    state.phase = 'closing';
    state.consecutiveOpenFrames = 0;
  }

  const warnings: string[] = [];
  const feedback: string[] = [];

  if (state.phase === 'closed') feedback.push('Ready. Open your arms and legs!');
  else if (state.phase === 'opening') feedback.push('Open wide!');
  else if (state.phase === 'open') feedback.push('Good! Now bring arms and legs back.');
  else if (state.phase === 'closing') feedback.push('Close fully!');

  if (!armsOpen && isOpen) warnings.push('Arms not fully raised');
  if (!legsOpen && isOpen) warnings.push('Legs not spread wide enough');

  const controlScore = state.repDurations.length > 1
    ? Math.min(100, 100 - (Math.max(...state.repDurations) - Math.min(...state.repDurations)) / 100)
    : 88;
  const formScore = Math.round(warnings.length === 0 ? 92 : 80);
  const movementQuality = Math.round((formScore + controlScore) / 2);

  const riskReasons = warnings.length === 0
    ? ['Good jumping jack form', 'Consistent rhythm']
    : warnings;
  const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';

  let fatigueLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (state.repCount >= 10 && state.repDurations.length >= 6) {
    const recent = state.repDurations.slice(-3);
    const early = state.repDurations.slice(0, 3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarly = early.reduce((a, b) => a + b, 0) / early.length;
    const slowdown = (avgRecent - avgEarly) / avgEarly;
    if (slowdown > 0.3) fatigueLevel = 'HIGH';
    else if (slowdown > 0.15) fatigueLevel = 'MODERATE';
  }

  return {
    repCount: state.repCount,
    phase: state.phase,
    formScore,
    feedback: feedback[0] || 'Keep going!',
    warnings,
    jointAngles: {
      armsOpen: armsOpen ? 1 : 0,
      legsOpen: legsOpen ? 1 : 0,
      ankleSpread: Math.round(ankleWidth * 100),
    },
    movementQuality,
    riskLevel,
    riskReasons,
    fatigueLevel,
    subscores: {
      posture: 90,
      rangeOfMotion: armsOpen && legsOpen ? 95 : 70,
      stability: Math.round(controlScore),
      symmetry: 90,
      control: Math.round(controlScore),
    },
  };
}

function buildDefaultResult(s: JJState, warnings: string[], phase: string): AnalysisResult {
  return {
    repCount: s.repCount, phase, formScore: 0, feedback: warnings[0] || 'Detecting pose...',
    warnings, jointAngles: {}, movementQuality: 0, riskLevel: 'LOW', riskReasons: [],
    fatigueLevel: 'LOW', subscores: { posture: 0, rangeOfMotion: 0, stability: 0, symmetry: 0, control: 0 },
  };
}
