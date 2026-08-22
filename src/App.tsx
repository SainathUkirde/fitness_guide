import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, BarChart2, History, BookOpen, Settings, Menu, X, Zap,
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { LiveWorkout } from './pages/LiveWorkout';
import { Analytics } from './pages/Analytics';
import { WorkoutHistory } from './pages/History';
import { Exercises } from './pages/Exercises';
import { Settings as SettingsPage } from './pages/Settings';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workout', label: 'Live Workout', icon: Activity },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/history', label: 'History', icon: History },
  { path: '/exercises', label: 'Exercises', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ path, label, Icon }: { path: string; label: string; Icon: React.ElementType }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === path;
  return (
    <button
      onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 mb-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-black text-sm leading-none">SportSense AI</div>
          <div className="text-slate-500 text-[10px] leading-none mt-0.5">Fitness Coach</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavItem key={path} path={path} label={label} Icon={Icon} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800">
        <p className="text-slate-600 text-[10px] leading-tight">
          Pose processing runs locally in your browser. No data is uploaded.
        </p>
      </div>
    </div>
  );
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-56 bg-[#0f1629] border-r border-slate-800 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 bg-[#0f1629] border-r border-slate-800 flex flex-col">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 bg-[#0f1629] border-b border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm">SportSense AI</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<LiveWorkout />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
