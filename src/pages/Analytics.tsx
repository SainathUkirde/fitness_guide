import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getWorkouts } from '../storage/workoutStorage';
import { TrendingUp, BarChart2, PieChart as PieIcon, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const Analytics: React.FC = () => {
  const workouts = getWorkouts();

  const formData = useMemo(() =>
    workouts.map((w, i) => ({
      session: `S${i + 1}`,
      form: w.avgFormScore,
      quality: w.movementQuality,
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    [workouts.length]
  );

  const repData = useMemo(() =>
    workouts.map((w, i) => ({
      session: `S${i + 1}`,
      reps: w.repCount,
      exercise: w.exercise,
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    [workouts.length]
  );

  const exerciseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workouts.forEach((w) => {
      counts[w.exercise] = (counts[w.exercise] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    }));
  }, [workouts.length]);

  const riskData = useMemo(() => {
    const issues: Record<string, number> = {};
    workouts.forEach((w) => {
      w.formIssues.forEach(({ issue, count }) => {
        issues[issue] = (issues[issue] || 0) + count;
      });
    });
    return Object.entries(issues).map(([name, value]) => ({ name, value }));
  }, [workouts.length]);

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <BarChart2 size={56} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Analytics Data</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Complete at least one workout to see your analytics charts here.
        </p>
      </div>
    );
  }

  const chartTooltipStyle = {
    contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' },
    labelStyle: { color: '#94a3b8' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm">Performance trends across {workouts.length} workout sessions</p>
      </div>

      {workouts.length < 2 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 text-sm">
          Complete more workouts to see meaningful trends and charts.
        </div>
      )}

      {/* Form Score + Quality Over Time */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-blue-400" />
          <h3 className="text-white font-semibold">Form Score & Movement Quality Over Time</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={formData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="session" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip {...chartTooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Line type="monotone" dataKey="form" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="Form Score" />
            <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Movement Quality" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reps Over Time */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-emerald-400" />
          <h3 className="text-white font-semibold">Repetitions Per Session</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={repData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="session" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="reps" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Reps" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exercise Distribution */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={16} className="text-yellow-400" />
            <h3 className="text-white font-semibold">Exercise Distribution</h3>
          </div>
          {exerciseDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={exerciseDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {exerciseDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {exerciseDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-400 text-xs">{item.name}</span>
                    <span className="text-white text-xs font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data yet.</p>
          )}
        </div>

        {/* Risk Indicators */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-yellow-400" />
            <h3 className="text-white font-semibold">Form Issues Overview</h3>
          </div>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              No form issues recorded — great work!
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg Form Score', value: `${Math.round(workouts.reduce((a, b) => a + b.avgFormScore, 0) / workouts.length)}%` },
          { label: 'Avg Quality', value: `${Math.round(workouts.reduce((a, b) => a + b.movementQuality, 0) / workouts.length)}%` },
          { label: 'Total Reps', value: String(workouts.reduce((a, b) => a + b.repCount, 0)) },
          { label: 'LOW Risk Sessions', value: String(workouts.filter((w) => w.riskLevel === 'LOW').length) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white metric-number">{value}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
