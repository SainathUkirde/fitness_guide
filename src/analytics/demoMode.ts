import type { AnalysisResult } from '../exercises/SquatAnalyzer';
import type { ExerciseType } from '../storage/workoutStorage';

// Demo mode simulates realistic workout data for presentation purposes

interface DemoFrame {
  repCount: number;
  phase: string;
  formScore: number;
  movementQuality: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  fatigueLevel: 'LOW' | 'MODERATE' | 'HIGH';
  feedback: string;
  jointAngles: Record<string, number>;
  subscores: { posture: number; rangeOfMotion: number; stability: number; symmetry: number; control: number };
  riskReasons: string[];
  warnings: string[];
}

const SQUAT_SEQUENCE: Partial<DemoFrame>[] = [
  { phase: 'standing', formScore: 88, feedback: 'Ready. Begin your squat.', jointAngles: { leftKnee: 170, rightKnee: 168, torso: 5 } },
  { phase: 'standing', formScore: 88, feedback: 'Ready. Begin your squat.', jointAngles: { leftKnee: 170, rightKnee: 168, torso: 5 } },
  { phase: 'descending', formScore: 86, feedback: 'Keep descending...', jointAngles: { leftKnee: 140, rightKnee: 138, torso: 12 } },
  { phase: 'descending', formScore: 85, feedback: 'Good descent, control the movement.', jointAngles: { leftKnee: 115, rightKnee: 113, torso: 18 } },
  { phase: 'bottom', formScore: 91, feedback: 'Great squat depth!', jointAngles: { leftKnee: 88, rightKnee: 87, torso: 22 } },
  { phase: 'bottom', formScore: 91, feedback: 'Great squat depth!', jointAngles: { leftKnee: 86, rightKnee: 85, torso: 22 } },
  { phase: 'ascending', formScore: 89, feedback: 'Drive through your heels to stand.', jointAngles: { leftKnee: 110, rightKnee: 109, torso: 15 } },
  { phase: 'ascending', formScore: 90, feedback: 'Drive through your heels to stand.', jointAngles: { leftKnee: 145, rightKnee: 143, torso: 8 } },
];

const PUSHUP_SEQUENCE: Partial<DemoFrame>[] = [
  { phase: 'top', formScore: 87, feedback: 'Ready. Begin your push-up.', jointAngles: { leftElbow: 170, rightElbow: 168, bodyAlignment: 2 } },
  { phase: 'top', formScore: 87, feedback: 'Ready. Begin your push-up.', jointAngles: { leftElbow: 170, rightElbow: 168, bodyAlignment: 2 } },
  { phase: 'descending', formScore: 85, feedback: 'Lower your body with control.', jointAngles: { leftElbow: 130, rightElbow: 128, bodyAlignment: 3 } },
  { phase: 'descending', formScore: 84, feedback: 'Lower your body with control.', jointAngles: { leftElbow: 100, rightElbow: 98, bodyAlignment: 4 } },
  { phase: 'bottom', formScore: 90, feedback: 'Great depth!', jointAngles: { leftElbow: 78, rightElbow: 76, bodyAlignment: 3 } },
  { phase: 'bottom', formScore: 90, feedback: 'Great depth!', jointAngles: { leftElbow: 76, rightElbow: 75, bodyAlignment: 3 } },
  { phase: 'ascending', formScore: 88, feedback: 'Push up through your chest.', jointAngles: { leftElbow: 110, rightElbow: 109, bodyAlignment: 3 } },
  { phase: 'ascending', formScore: 89, feedback: 'Push up through your chest.', jointAngles: { leftElbow: 148, rightElbow: 146, bodyAlignment: 2 } },
];

const CURL_SEQUENCE: Partial<DemoFrame>[] = [
  { phase: 'extended', formScore: 88, feedback: 'Ready. Curl your arm up.', jointAngles: { leftElbow: 165, rightElbow: 163, upperArmSwing: 1 } },
  { phase: 'extended', formScore: 88, feedback: 'Ready. Curl your arm up.', jointAngles: { leftElbow: 165, rightElbow: 163, upperArmSwing: 1 } },
  { phase: 'curling', formScore: 87, feedback: 'Curl upward with control.', jointAngles: { leftElbow: 120, rightElbow: 118, upperArmSwing: 2 } },
  { phase: 'curling', formScore: 86, feedback: 'Keep your upper arm stable.', jointAngles: { leftElbow: 80, rightElbow: 78, upperArmSwing: 3 } },
  { phase: 'contracted', formScore: 93, feedback: 'Great! Now slowly lower the weight.', jointAngles: { leftElbow: 45, rightElbow: 43, upperArmSwing: 2 } },
  { phase: 'contracted', formScore: 93, feedback: 'Great! Now slowly lower the weight.', jointAngles: { leftElbow: 42, rightElbow: 41, upperArmSwing: 2 } },
  { phase: 'extending', formScore: 90, feedback: 'Extend fully for complete range of motion.', jointAngles: { leftElbow: 100, rightElbow: 98, upperArmSwing: 2 } },
  { phase: 'extending', formScore: 90, feedback: 'Extend fully for complete range of motion.', jointAngles: { leftElbow: 140, rightElbow: 138, upperArmSwing: 1 } },
];

const JJ_SEQUENCE: Partial<DemoFrame>[] = [
  { phase: 'closed', formScore: 92, feedback: 'Ready. Open your arms and legs!', jointAngles: { armsOpen: 0, legsOpen: 0, ankleSpread: 15 } },
  { phase: 'opening', formScore: 90, feedback: 'Open wide!', jointAngles: { armsOpen: 0, legsOpen: 0, ankleSpread: 30 } },
  { phase: 'open', formScore: 94, feedback: 'Good! Now bring arms and legs back.', jointAngles: { armsOpen: 1, legsOpen: 1, ankleSpread: 60 } },
  { phase: 'open', formScore: 94, feedback: 'Good! Now bring arms and legs back.', jointAngles: { armsOpen: 1, legsOpen: 1, ankleSpread: 58 } },
  { phase: 'closing', formScore: 91, feedback: 'Close fully!', jointAngles: { armsOpen: 0, legsOpen: 0, ankleSpread: 30 } },
  { phase: 'closing', formScore: 91, feedback: 'Close fully!', jointAngles: { armsOpen: 0, legsOpen: 0, ankleSpread: 20 } },
];

const SEQUENCES: Record<ExerciseType, Partial<DemoFrame>[]> = {
  squat: SQUAT_SEQUENCE,
  pushup: PUSHUP_SEQUENCE,
  bicep_curl: CURL_SEQUENCE,
  jumping_jack: JJ_SEQUENCE,
};

interface DemoState {
  frameIndex: number;
  repCount: number;
  repInSequence: number;
  elapsedFrames: number;
  fatigueTrigger: number;
}

const demoStates: Record<string, DemoState> = {};

function getState(exercise: ExerciseType): DemoState {
  if (!demoStates[exercise]) {
    demoStates[exercise] = { frameIndex: 0, repCount: 0, repInSequence: 0, elapsedFrames: 0, fatigueTrigger: 15 };
  }
  return demoStates[exercise];
}

export function resetDemoMode(exercise: ExerciseType) {
  demoStates[exercise] = { frameIndex: 0, repCount: 0, repInSequence: 0, elapsedFrames: 0, fatigueTrigger: 15 };
}

export function getDemoFrame(exercise: ExerciseType): AnalysisResult {
  const seq = SEQUENCES[exercise];
  const st = getState(exercise);

  st.elapsedFrames++;
  if (st.elapsedFrames % 3 !== 0) {
    // Throttle: return same frame every 3 calls to simulate ~10fps
    st.elapsedFrames++;
  }

  const frame = seq[st.frameIndex];
  const nextIndex = (st.frameIndex + 1) % seq.length;

  // Detect rep completion (cycle through full sequence)
  if (nextIndex === 0) {
    st.repCount++;
    st.repInSequence++;
  }
  st.frameIndex = nextIndex;

  const fatigue: 'LOW' | 'MODERATE' | 'HIGH' =
    st.repCount >= st.fatigueTrigger + 5 ? 'HIGH' :
    st.repCount >= st.fatigueTrigger ? 'MODERATE' : 'LOW';

  const formScore = Math.min(100, Math.max(60,
    (frame.formScore || 88) - (st.repCount > 10 ? Math.floor(st.repCount / 5) : 0)
  ));
  const movementQuality = Math.min(100, Math.max(60, formScore - 3));

  return {
    repCount: st.repCount,
    phase: frame.phase || 'standing',
    formScore,
    feedback: frame.feedback || 'Keep going!',
    warnings: frame.warnings || [],
    jointAngles: frame.jointAngles || {},
    movementQuality,
    riskLevel: st.repCount > st.fatigueTrigger + 5 ? 'MODERATE' : 'LOW',
    riskReasons: st.repCount > st.fatigueTrigger
      ? ['Movement consistency slightly reduced', 'Slight form degradation detected']
      : ['Stable movement pattern', 'Consistent repetitions'],
    fatigueLevel: fatigue,
    subscores: frame.subscores || {
      posture: Math.round(formScore * 0.95),
      rangeOfMotion: Math.round(formScore * 0.92),
      stability: Math.round(formScore * 0.93),
      symmetry: Math.round(formScore * 0.96),
      control: Math.round(formScore * 0.94),
    },
  };
}
