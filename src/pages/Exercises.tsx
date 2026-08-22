import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, ChevronDown, ChevronUp } from 'lucide-react';

interface ExerciseGuide {
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  muscles: string[];
  description: string;
  instructions: string[];
  commonMistakes: string[];
  formTips: string[];
}

const GUIDES: ExerciseGuide[] = [
  {
    id: 'squat',
    name: 'Squat',
    difficulty: 'Beginner',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core', 'Lower Back'],
    description: 'A fundamental lower-body compound movement that builds strength and muscle across the legs and core.',
    instructions: [
      'Stand with feet shoulder-width apart, toes slightly turned out.',
      'Keep your chest up and core braced.',
      'Descend by pushing your hips back and bending your knees.',
      'Lower until thighs are at least parallel to the floor.',
      'Drive through your heels to return to standing.',
      'Keep your knees tracking over your toes throughout.',
    ],
    commonMistakes: [
      'Shallow depth (not reaching parallel)',
      'Excessive forward torso lean',
      'Knees caving inward',
      'Heels rising off the ground',
      'Looking down instead of forward',
    ],
    formTips: [
      'Imagine sitting back into a chair to improve hip hinge.',
      'Keep a "proud chest" — shoulders back and down.',
      'Drive knees out over the little toes.',
      'Take a deep breath before descending to brace your core.',
    ],
  },
  {
    id: 'pushup',
    name: 'Push-Up',
    difficulty: 'Beginner',
    muscles: ['Chest (Pectoralis)', 'Triceps', 'Anterior Deltoid', 'Core'],
    description: 'A foundational upper-body pushing exercise that also requires significant core stability.',
    instructions: [
      'Start in a high plank position, hands just wider than shoulders.',
      'Keep your body in a straight line from head to heels.',
      'Lower your chest toward the floor, elbows at ~45° angle.',
      'Lower until your chest nearly touches the floor.',
      'Push through your palms to return to starting position.',
      'Maintain a rigid body throughout — avoid sagging hips.',
    ],
    commonMistakes: [
      'Hips sagging down (poor core engagement)',
      'Hips piked too high',
      'Partial range of motion (not going deep enough)',
      'Flaring elbows out too wide',
      'Looking up or down instead of neutral spine',
    ],
    formTips: [
      'Squeeze your glutes and abs throughout the movement.',
      'Think about pushing the floor away rather than pushing yourself up.',
      'Keep elbows at 45° — not flared out at 90°.',
      'Start with knee push-ups if full push-ups are too difficult.',
    ],
  },
  {
    id: 'bicep_curl',
    name: 'Bicep Curl',
    difficulty: 'Beginner',
    muscles: ['Biceps Brachii', 'Brachialis', 'Forearms'],
    description: 'An isolation exercise targeting the biceps through elbow flexion.',
    instructions: [
      'Stand with feet shoulder-width apart, dumbbells at sides.',
      'Keep upper arms completely still against your torso.',
      'Curl the weight upward, rotating palms to face up.',
      'Squeeze the bicep at the top of the movement.',
      'Slowly lower the weight back to full extension.',
      'Avoid swinging your torso to generate momentum.',
    ],
    commonMistakes: [
      'Swinging the torso / using momentum',
      'Not completing full extension at the bottom',
      'Elbows drifting forward during the curl',
      'Rushing through the movement',
    ],
    formTips: [
      'Press your upper arms against your torso to prevent cheating.',
      'Take 2 seconds to curl up, 3 seconds to lower down.',
      'Full extension at the bottom maximizes the range of motion.',
      'Supinate (rotate) your forearm as you lift for full activation.',
    ],
  },
  {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    difficulty: 'Beginner',
    muscles: ['Full Body', 'Hip Abductors', 'Deltoids', 'Calves', 'Cardiovascular System'],
    description: 'A classic cardio exercise that improves coordination, burns calories, and warms up the full body.',
    instructions: [
      'Start standing with feet together, arms at sides.',
      'Jump feet apart (shoulder width or wider) while raising arms overhead.',
      'Arms should reach straight overhead or slightly clapped above head.',
      'Jump feet back together while lowering arms to sides.',
      'Land softly with slightly bent knees to absorb impact.',
      'Maintain a steady rhythm throughout.',
    ],
    commonMistakes: [
      'Arms not reaching above head level',
      'Feet not spreading wide enough',
      'Hard landings without bending knees',
      'Losing rhythm consistency',
    ],
    formTips: [
      'Land softly on the balls of your feet to reduce joint impact.',
      'Keep a consistent tempo for best cardio benefit.',
      'Extend fully — arms overhead and legs wide — each rep.',
      'Increase speed as fitness improves.',
    ],
  },
];

export const Exercises: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>('squat');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Exercise Guide</h1>
        <p className="text-slate-400 text-sm">Proper form and technique for all tracked exercises</p>
      </div>

      {GUIDES.map((guide) => (
        <div key={guide.id} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/60 transition-colors"
            onClick={() => setExpanded(expanded === guide.id ? null : guide.id)}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-blue-400" />
              <div className="text-left">
                <div className="text-white font-semibold">{guide.name}</div>
                <div className="text-slate-400 text-xs">{guide.difficulty} · {guide.muscles.slice(0, 3).join(', ')}</div>
              </div>
            </div>
            {expanded === guide.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          {expanded === guide.id && (
            <div className="px-5 pb-5 space-y-5 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm pt-4 leading-relaxed">{guide.description}</p>

              {/* Muscles */}
              <div>
                <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Target Muscles</h4>
                <div className="flex flex-wrap gap-1.5">
                  {guide.muscles.map((m) => (
                    <span key={m} className="bg-blue-500/10 text-blue-300 text-xs px-2.5 py-1 rounded-full border border-blue-500/20">{m}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Instructions */}
                <div>
                  <h4 className="text-emerald-400 text-xs uppercase tracking-wider mb-2">Instructions</h4>
                  <ol className="space-y-1.5">
                    {guide.instructions.map((inst, i) => (
                      <li key={i} className="flex gap-2 text-slate-300 text-sm">
                        <span className="text-emerald-400 font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Common Mistakes */}
                <div>
                  <h4 className="text-yellow-400 text-xs uppercase tracking-wider mb-2">Common Mistakes</h4>
                  <ul className="space-y-1.5">
                    {guide.commonMistakes.map((m, i) => (
                      <li key={i} className="flex gap-2 text-slate-300 text-sm">
                        <span className="text-yellow-400 flex-shrink-0">⚠</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Form Tips */}
                <div>
                  <h4 className="text-blue-400 text-xs uppercase tracking-wider mb-2">Form Tips</h4>
                  <ul className="space-y-1.5">
                    {guide.formTips.map((t, i) => (
                      <li key={i} className="flex gap-2 text-slate-300 text-sm">
                        <span className="text-blue-400 flex-shrink-0">✓</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => navigate('/workout')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Play size={14} /> Start {guide.name} Analysis
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
