import React from 'react';
import type { AnalysisResult } from '../exercises/SquatAnalyzer';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  result: AnalysisResult;
  isDemo?: boolean;
}

function RiskBadge({ level }: { level: 'LOW' | 'MODERATE' | 'HIGH' }) {
  const colors = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MODERATE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[level]}`}>
      {level}
    </span>
  );
}

function ScoreBar({ value }: { value: number }) {
  const colorClass = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export const MetricsPanel: React.FC<Props> = ({ result, isDemo }) => {
  const phaseLabel = result.phase.charAt(0).toUpperCase() + result.phase.slice(1);

  const FatigueIcon = result.fatigueLevel === 'LOW' ? TrendingUp :
    result.fatigueLevel === 'MODERATE' ? Minus : TrendingDown;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {isDemo && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-center">
          <span className="text-yellow-400 text-xs font-bold">⚡ DEMO MODE — SIMULATED DATA</span>
        </div>
      )}

      {/* Rep Count */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Reps</div>
        <div className="text-5xl font-black text-white metric-number">{result.repCount}</div>
        <div className="text-slate-400 text-xs mt-1">{phaseLabel}</div>
      </div>

      {/* Form Score */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Form Score</span>
          <span className="text-2xl font-black text-blue-400 metric-number">{result.formScore}</span>
        </div>
        <ScoreBar value={result.formScore} />
        <div className="grid grid-cols-1 gap-1 mt-3">
          {Object.entries(result.subscores).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-slate-500 text-xs w-28 flex-shrink-0 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <ScoreBar value={val} />
              <span className="text-slate-400 text-xs w-8 text-right">{val}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Movement Quality */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Movement Quality</span>
          <span className="text-2xl font-black text-emerald-400 metric-number">{result.movementQuality}</span>
        </div>
        <ScoreBar value={result.movementQuality} />
      </div>

      {/* Risk Indicator */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Risk Indicator</span>
          <RiskBadge level={result.riskLevel} />
        </div>
        <div className="space-y-1 mt-2">
          {result.riskReasons.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className={`text-xs mt-0.5 ${r.startsWith('Stable') || r.startsWith('Good') || r.startsWith('Consistent') ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {r.startsWith('Stable') || r.startsWith('Good') || r.startsWith('Consistent') ? '✓' : '⚠'}
              </span>
              <span className="text-slate-400 text-xs">{r}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-[10px] mt-2 leading-tight">
          Movement-risk indicators are experimental fitness feedback and are not a medical diagnosis.
        </p>
      </div>

      {/* Fatigue */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Fatigue Indicator</span>
          <div className="flex items-center gap-1.5">
            <FatigueIcon size={14} className={
              result.fatigueLevel === 'LOW' ? 'text-emerald-400' :
              result.fatigueLevel === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
            } />
            <RiskBadge level={result.fatigueLevel} />
          </div>
        </div>
        {result.fatigueLevel !== 'LOW' && (
          <p className="text-slate-400 text-xs mt-2">Movement consistency has decreased during recent repetitions.</p>
        )}
      </div>

      {/* Joint Angles */}
      {Object.keys(result.jointAngles).length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Joint Angles</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(result.jointAngles).map(([joint, angle]) => (
              <div key={joint} className="text-center">
                <div className="text-blue-400 text-lg font-bold metric-number">{angle}°</div>
                <div className="text-slate-500 text-xs capitalize">{joint.replace(/([A-Z])/g, ' $1')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coach Feedback */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="text-blue-400 text-xs font-medium uppercase tracking-wider mb-2">AI Coach</div>
        <p className="text-white text-sm leading-relaxed">"{result.feedback}"</p>
        {result.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-1.5 text-yellow-400 text-xs">
                <span>⚠</span> {w}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
