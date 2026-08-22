import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart2, History, BookOpen, Play, TrendingUp, Award, Zap } from 'lucide-react';
import { getWorkouts } from '../storage/workoutStorage';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const workouts = getWorkouts();

  const today = new Date().toDateString();
  const todaySessions = workouts.filter((w) => new Date(w.date).toDateString() === today);
  const totalReps = workouts.reduce((a, b) => a + b.repCount, 0);
  const bestFormScore = workouts.length > 0 ? Math.max(...workouts.map((w) => w.avgFormScore)) : 0;

  const stats = [
    { label: "Today's Sessions", value: String(todaySessions.length), icon: <Activity size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Workouts', value: String(workouts.length), icon: <BarChart2 size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Best Form Score', value: bestFormScore > 0 ? `${bestFormScore}%` : '—', icon: <Award size={20} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Total Reps', value: String(totalReps), icon: <Zap size={20} />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const quickActions = [
    { label: 'Start Workout', icon: <Play size={18} />, path: '/workout', primary: true },
    { label: 'View Analytics', icon: <TrendingUp size={18} />, path: '/analytics', primary: false },
    { label: 'Workout History', icon: <History size={18} />, path: '/history', primary: false },
    { label: 'Exercise Guide', icon: <BookOpen size={18} />, path: '/exercises', primary: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">SportSense AI</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your AI-Powered Real-Time Fitness Coach</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-blue-900/60 to-slate-900 border border-blue-500/20 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">Real-Time Analysis</p>
              <h2 className="text-2xl font-black text-white mb-2">AI-Powered Movement Analysis</h2>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Computer vision tracks your pose in real time, counting reps, scoring form, and providing corrective coaching — directly in your browser.
              </p>
              <button
                onClick={() => navigate('/workout')}
                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
              >
                <Play size={18} /> Start Workout
              </button>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-6xl font-black text-blue-400/20 leading-none select-none">AI</div>
              <div className="text-slate-600 text-xs mt-1">MediaPipe Pose</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`border rounded-xl p-4 ${bg}`}>
            <div className={`mb-2 ${color}`}>{icon}</div>
            <div className="text-2xl font-black text-white metric-number">{value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon, path, primary }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`p-4 rounded-xl border font-medium flex items-center gap-2.5 transition-all hover:scale-105 ${
                primary
                  ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Workouts */}
      {workouts.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Recent Workouts</h3>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
            {workouts.slice(-5).reverse().map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 last:border-0">
                <div>
                  <span className="text-white text-sm font-medium capitalize">{w.exercise.replace('_', ' ')}</span>
                  <span className="text-slate-500 text-xs ml-2">{new Date(w.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">{w.repCount} reps</span>
                  <span className="text-blue-400 font-medium">{w.avgFormScore}% form</span>
                  <span className={`text-xs font-bold ${w.riskLevel === 'LOW' ? 'text-emerald-400' : w.riskLevel === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {w.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {workouts.length === 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center">
          <Activity size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No workouts yet. Start your first session!</p>
          <button
            onClick={() => navigate('/workout')}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Start Workout
          </button>
        </div>
      )}
    </div>
  );
};
