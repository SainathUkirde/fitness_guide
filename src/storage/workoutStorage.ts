export type ExerciseType = 'squat' | 'pushup' | 'bicep_curl' | 'jumping_jack';

export interface WorkoutSession {
  id: string;
  date: string;
  exercise: ExerciseType;
  duration: number; // seconds
  repCount: number;
  avgFormScore: number;
  movementQuality: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  fatigueLevel: 'LOW' | 'MODERATE' | 'HIGH';
  formIssues: { issue: string; count: number }[];
  recommendations: string[];
  subscores: {
    posture: number;
    rangeOfMotion: number;
    stability: number;
    symmetry: number;
    control: number;
  };
}

const STORAGE_KEY = 'sportsense_workouts';

export function saveWorkout(session: WorkoutSession): void {
  const existing = getWorkouts();
  existing.push(session);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    console.error('Failed to save workout to localStorage');
  }
}

export function getWorkouts(): WorkoutSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearWorkouts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateWorkoutId(): string {
  return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getExerciseLabel(exercise: ExerciseType): string {
  const labels: Record<ExerciseType, string> = {
    squat: 'Squat',
    pushup: 'Push-Up',
    bicep_curl: 'Bicep Curl',
    jumping_jack: 'Jumping Jack',
  };
  return labels[exercise];
}

export function generateRecommendations(session: WorkoutSession): string[] {
  const recs: string[] = [];

  if (session.subscores.rangeOfMotion < 75) {
    recs.push('Focus on improving your range of motion — try to go deeper each rep.');
  }
  if (session.subscores.posture < 75) {
    recs.push('Work on maintaining better posture throughout the exercise.');
  }
  if (session.subscores.symmetry < 75) {
    recs.push('Notice the asymmetry in your movement — practice single-limb exercises to balance.');
  }
  if (session.subscores.control < 75) {
    recs.push('Slow down your repetitions to improve movement control.');
  }
  if (session.fatigueLevel === 'HIGH') {
    recs.push('Movement consistency decreased near the end — consider shorter sets with better rest.');
  }
  if (session.fatigueLevel === 'MODERATE') {
    recs.push('Signs of fatigue detected. Ensure adequate rest between sets.');
  }
  if (session.riskLevel === 'HIGH') {
    recs.push('Multiple movement risk indicators detected — reduce intensity and focus on form.');
  }
  if (session.avgFormScore > 85) {
    recs.push('Excellent form! Try increasing resistance or reps to progress.');
  }

  const formIssueTexts = session.formIssues.map((fi) => fi.issue.toLowerCase());
  if (formIssueTexts.some((i) => i.includes('shallow') || i.includes('depth'))) {
    recs.push('Focus on deeper squat range — aim for thighs parallel to the floor.');
  }
  if (formIssueTexts.some((i) => i.includes('lean') || i.includes('torso'))) {
    recs.push('Maintain a more upright torso position during squats.');
  }
  if (formIssueTexts.some((i) => i.includes('swing'))) {
    recs.push('Avoid swinging your body during curls — keep upper arms stationary.');
  }

  if (recs.length === 0) recs.push('Great workout! Keep up the consistency and consider increasing intensity.');

  return recs.slice(0, 4);
}
