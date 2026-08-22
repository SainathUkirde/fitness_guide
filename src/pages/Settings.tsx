import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Trash2, Volume2, VolumeX, Camera } from 'lucide-react';
import { clearWorkouts, getWorkouts } from '../storage/workoutStorage';

export const Settings: React.FC = () => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackFrequency, setFeedbackFrequency] = useState<'always' | 'sometimes' | 'rarely'>('always');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [saved, setSaved] = useState(false);
  const workoutCount = getWorkouts().length;

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const cams = devices.filter((d) => d.kind === 'videoinput');
      setCameras(cams);
      if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
    }).catch(() => {});
  }, []);

  const handleSave = () => {
    localStorage.setItem('sportsense_settings', JSON.stringify({ soundEnabled, feedbackFrequency, selectedCamera }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearWorkouts();
    setConfirmClear(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Customize your SportSense AI experience</p>
      </div>

      {/* Camera Settings */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Camera size={16} className="text-blue-400" />
          <h3 className="text-white font-semibold">Camera</h3>
        </div>
        {cameras.length > 0 ? (
          <div>
            <label className="text-slate-400 text-sm block mb-2">Select Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No cameras detected. Grant camera permissions first.</p>
        )}
      </div>

      {/* Feedback Settings */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon size={16} className="text-blue-400" />
          <h3 className="text-white font-semibold">Feedback</h3>
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-slate-300 text-sm font-medium">Sound Feedback</label>
            <p className="text-slate-500 text-xs">Audio cues for form corrections</p>
          </div>
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${soundEnabled ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Feedback Frequency */}
        <div>
          <label className="text-slate-300 text-sm font-medium block mb-2">Feedback Frequency</label>
          <div className="flex gap-2">
            {(['always', 'sometimes', 'rarely'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setFeedbackFrequency(freq)}
                className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${feedbackFrequency === freq ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Trash2 size={16} className="text-red-400" />
          <h3 className="text-white font-semibold">Privacy & Data</h3>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <p className="text-emerald-400 text-sm">
            🔒 Camera processing happens locally in your browser. Video is never uploaded or stored. Only numerical workout results are saved to LocalStorage.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm font-medium">Workout History</p>
            <p className="text-slate-500 text-xs">{workoutCount} sessions stored locally</p>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={workoutCount === 0}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
      >
        {saved ? '✓ Settings Saved!' : 'Save Settings'}
      </button>

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Clear Workout History?</h3>
            <p className="text-slate-400 text-sm mb-4">
              This will permanently delete all {workoutCount} workout sessions. This cannot be undone.
            </p>
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
