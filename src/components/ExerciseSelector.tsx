import React from 'react';
import { type ExerciseType } from '../storage/workoutStorage';
import { Dumbbell, ArrowUp, Zap, Star } from 'lucide-react';

interface Exercise {
  id: ExerciseType;
  label: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  muscles: string[];
  icon: React.ReactNode;
  description: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 'squat',
    label: 'Squat',
    difficulty: 'Beginner',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    icon: <ArrowUp size={20} />,
    description: 'Full lower-body compound movement tracking knee and hip angles.',
  },
  {
    id: 'pushup',
    label: 'Push-Up',
    difficulty: 'Beginner',
    muscles: ['Chest', 'Triceps', 'Shoulders', 'Core'],
    icon: <Dumbbell size={20} />,
    description: 'Upper body push with body alignment and elbow angle tracking.',
  },
  {
    id: 'bicep_curl',
    label: 'Bicep Curl',
    difficulty: 'Beginner',
    muscles: ['Biceps', 'Forearms'],
    icon: <Star size={20} />,
    description: 'Isolated arm curl tracking elbow angle and arm stability.',
  },
  {
    id: 'jumping_jack',
    label: 'Jumping Jack',
    difficulty: 'Beginner',
    muscles: ['Full Body', 'Cardio', 'Coordination'],
    icon: <Zap size={20} />,
    description: 'Cardio movement tracking arm and leg position for rep counting.',
  },
];

interface Props {
  selected: ExerciseType;
  onChange: (exercise: ExerciseType) => void;
}

export const ExerciseSelector: React.FC<Props> = ({ selected, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {EXERCISES.map((ex) => {
        const isSelected = selected === ex.id;
        return (
          <button
            key={ex.id}
            onClick={() => onChange(ex.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/70'
            }`}
          >
            <div className={`mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
              {ex.icon}
            </div>
            <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
              {ex.label}
            </div>
            <div className="text-slate-500 text-xs mt-0.5">{ex.difficulty}</div>
            <div className="text-slate-500 text-xs mt-1 line-clamp-2">{ex.description}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {ex.muscles.slice(0, 2).map((m) => (
                <span key={m} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                  {m}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export { EXERCISES };
export type { Exercise };
