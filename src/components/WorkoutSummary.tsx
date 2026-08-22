import React from 'react';
import type { WorkoutSession } from '../storage/workoutStorage';
import { formatDuration, getExerciseLabel } from '../storage/workoutStorage';
import { CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  session: WorkoutSession;
  onSave: () => void;
  onDiscard: () => void;
}

function RiskBadge({ level }: { level: 'LOW' | 'MODERATE' | 'HIGH' }) {
  const c = level === 'LOW' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : level === 'MODERATE' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    : 'text-red-400 bg-red-500/10 border-red-500/30';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c}`}>{level}</span>;
}

export const WorkoutSummary: React.FC<Props> = ({ session, onSave, onDiscard }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-3">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Workout Complete!</h2>
            <p className="text-slate-400 text-sm mt-1">{getExerciseLabel(session.exercise)}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Duration', value: formatDuration(session.duration) },
              { label: 'Total Reps', value: String(session.repCount) },
              { label: 'Avg Form', value: `${session.avgFormScore}%` },
              { label: 'Movement Quality', value: `${session.movementQuality}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</div>
                <div className="text-2xl font-black text-white metric-number">{value}</div>
              </div>
            ))}
          </div>

          {/* Risk & Fatigue */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Risk</span>
              <RiskBadge level={session.riskLevel} />
            </div>
            <div className="flex-1 bg-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Fatigue</span>
              <RiskBadge level={session.fatigueLevel} />
            </div>
          </div>

          {/* Subscores */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Performance Breakdown</div>
            {Object.entries(session.subscores).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 mb-2">
                <span className="text-slate-400 text-xs w-28 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-slate-300 text-xs w-10 text-right">{val}%</span>
              </div>
            ))}
          </div>

          {/* Form Issues */}
          {session.formIssues.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">Form Issues Detected</span>
              </div>
              {session.formIssues.map(({ issue, count }) => (
                <div key={issue} className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-300 text-sm">{issue}</span>
                  <span className="text-yellow-400 text-xs font-bold">{count}×</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {session.recommendations.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-blue-400 text-xs uppercase tracking-wider">AI Recommendations</span>
              </div>
              {session.recommendations.map((rec, i) => (
                <p key={i} className="text-slate-300 text-sm mb-1.5">• {rec}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDiscard}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Discard
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
