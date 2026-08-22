import React, { useState } from 'react';
import { getWorkouts, clearWorkouts, type WorkoutSession } from '../storage/workoutStorage';
import { formatDuration, getExerciseLabel } from '../storage/workoutStorage';
import { History, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

function RiskBadge({ level }: { level: 'LOW' | 'MODERATE' | 'HIGH' }) {
  const c = level === 'LOW' ? 'text-emerald-400' : level === 'MODERATE' ? 'text-yellow-400' : 'text-red-400';
  return <span className={`text-xs font-bold ${c}`}>{level}</span>;
}

export const WorkoutHistory: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => [...getWorkouts()].reverse());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    clearWorkouts();
    setWorkouts([]);
    setConfirmClear(false);
  };

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <History size={56} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Workout History</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Complete your first workout to see your history here. Your sessions are stored locally in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Workout History</h1>
          <p className="text-slate-400 text-sm">{workouts.length} sessions recorded</p>
        </div>
        <button
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
        >
          <Trash2 size={14} /> Clear History
        </button>
      </div>

      {/* Table Header */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 px-4 py-2.5 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
          <span>Date</span>
          <span>Exercise</span>
          <span className="text-center">Reps</span>
          <span className="text-center">Form</span>
          <span className="text-center">Quality</span>
          <span className="text-center">Risk</span>
        </div>

        {workouts.map((w) => (
          <div key={w.id}>
            <div
              className="grid grid-cols-6 px-4 py-3 border-b border-slate-700/30 hover:bg-slate-800/60 cursor-pointer transition-colors items-center"
              onClick={() => setExpanded(expanded === w.id ? null : w.id)}
            >
              <span className="text-slate-300 text-sm">
                {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-white text-sm font-medium">{getExerciseLabel(w.exercise)}</span>
              <span className="text-slate-300 text-sm text-center">{w.repCount}</span>
              <span className="text-blue-400 text-sm font-medium text-center">{w.avgFormScore}%</span>
              <span className="text-slate-300 text-sm text-center">{w.movementQuality}%</span>
              <div className="flex items-center justify-center gap-1">
                <RiskBadge level={w.riskLevel} />
                <span className="text-slate-600">{expanded === w.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </div>

            {expanded === w.id && (
              <div className="px-4 pb-4 bg-slate-900/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 mb-4">
                  {[
                    { label: 'Duration', value: formatDuration(w.duration) },
                    { label: 'Fatigue', value: w.fatigueLevel },
                    { label: 'Reps', value: String(w.repCount) },
                    { label: 'Date', value: new Date(w.date).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800 rounded-lg p-3">
                      <div className="text-slate-500 text-xs">{label}</div>
                      <div className="text-white text-sm font-medium mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Subscores */}
                <div className="bg-slate-800 rounded-lg p-3 mb-3">
                  <div className="text-slate-500 text-xs mb-2">Performance Breakdown</div>
                  <div className="space-y-1.5">
                    {Object.entries(w.subscores).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs w-28 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                          <div className={`h-full rounded-full ${val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} />
                        </div>
                        <span className="text-slate-400 text-xs w-8 text-right">{val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Issues */}
                {w.formIssues.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={12} className="text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-medium">Form Issues</span>
                    </div>
                    {w.formIssues.map(({ issue, count }) => (
                      <div key={issue} className="flex justify-between">
                        <span className="text-slate-300 text-xs">{issue}</span>
                        <span className="text-yellow-400 text-xs">{count}×</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {w.recommendations.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="text-blue-400 text-xs font-medium mb-2">AI Recommendations</div>
                    {w.recommendations.map((rec, i) => (
                      <p key={i} className="text-slate-300 text-xs mb-1">• {rec}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Clear All History?</h3>
            <p className="text-slate-400 text-sm mb-4">This will permanently delete all {workouts.length} workout sessions. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleClear} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
