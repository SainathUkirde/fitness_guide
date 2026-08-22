import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, FlaskConical } from 'lucide-react';
import { CameraView } from '../components/CameraView';
import { MetricsPanel } from '../components/MetricsPanel';
import { ExerciseSelector } from '../components/ExerciseSelector';
import { WorkoutSummary } from '../components/WorkoutSummary';
import { analyzeSquat, resetSquatAnalyzer } from '../exercises/SquatAnalyzer';
import { analyzePushUp, resetPushUpAnalyzer } from '../exercises/PushUpAnalyzer';
import { analyzeBicepCurl, resetBicepCurlAnalyzer } from '../exercises/BicepCurlAnalyzer';
import { analyzeJumpingJack, resetJumpingJackAnalyzer } from '../exercises/JumpingJackAnalyzer';
import type { AnalysisResult } from '../exercises/SquatAnalyzer';
import type { NormalizedLandmark } from '../pose/landmarkUtils';
import type { ExerciseType, WorkoutSession } from '../storage/workoutStorage';
import {
  saveWorkout,
  generateWorkoutId,
  getExerciseLabel,
  formatDuration,
  generateRecommendations,
} from '../storage/workoutStorage';
import { getDemoFrame, resetDemoMode } from '../analytics/demoMode';

type WorkoutState = 'setup' | 'active' | 'paused' | 'summary';

const DEFAULT_RESULT: AnalysisResult = {
  repCount: 0,
  phase: 'standing',
  formScore: 0,
  feedback: 'Select an exercise and start your workout.',
  warnings: [],
  jointAngles: {},
  movementQuality: 0,
  riskLevel: 'LOW',
  riskReasons: [],
  fatigueLevel: 'LOW',
  subscores: { posture: 0, rangeOfMotion: 0, stability: 0, symmetry: 0, control: 0 },
};

export const LiveWorkout: React.FC = () => {
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [workoutState, setWorkoutState] = useState<WorkoutState>('setup');
  const [isDemo, setIsDemo] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [result, setResult] = useState<AnalysisResult>(DEFAULT_RESULT);
  const [sessionData, setSessionData] = useState<WorkoutSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [formScoreHistory, setFormScoreHistory] = useState<number[]>([]);
  const [formErrorLog, setFormErrorLog] = useState<Record<string, number>>({});
  const [cameraActive, setCameraActive] = useState(false);

  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAnalysis = useCallback(() => {
    if (isDemo) return; // demo handled separately
    const lms = landmarksRef.current;
    if (!lms) {
      setResult((prev) => ({
        ...prev,
        feedback: 'No pose detected. Move into frame.',
      }));
      return;
    }

    let res: AnalysisResult;
    if (exercise === 'squat') res = analyzeSquat(lms);
    else if (exercise === 'pushup') res = analyzePushUp(lms);
    else if (exercise === 'bicep_curl') res = analyzeBicepCurl(lms);
    else res = analyzeJumpingJack(lms);

    setResult(res);
    if (res.formScore > 0) {
      setFormScoreHistory((prev) => [...prev.slice(-100), res.formScore]);
    }
    res.warnings.forEach((w) => {
      setFormErrorLog((prev) => ({ ...prev, [w]: (prev[w] || 0) + 1 }));
    });
  }, [exercise, isDemo]);

  const resetAnalyzers = useCallback(() => {
    resetSquatAnalyzer();
    resetPushUpAnalyzer();
    resetBicepCurlAnalyzer();
    resetJumpingJackAnalyzer();
    if (isDemo) resetDemoMode(exercise);
  }, [exercise, isDemo]);

  const startWorkout = useCallback(() => {
    resetAnalyzers();
    setResult(DEFAULT_RESULT);
    setElapsedSeconds(0);
    setActiveSeconds(0);
    setFormScoreHistory([]);
    setFormErrorLog({});
    setWorkoutState('active');
    setCameraActive(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setActiveSeconds((s) => s + 1);
    }, 1000);

    if (!isDemo) {
      analysisRef.current = setInterval(runAnalysis, 100);
    } else {
      demoRef.current = setInterval(() => {
        const frame = getDemoFrame(exercise);
        setResult(frame);
        if (frame.formScore > 0) {
          setFormScoreHistory((prev) => [...prev.slice(-100), frame.formScore]);
        }
        frame.warnings.forEach((w) => {
          setFormErrorLog((prev) => ({ ...prev, [w]: (prev[w] || 0) + 1 }));
        });
      }, 300);
    }
  }, [resetAnalyzers, runAnalysis, isDemo, exercise]);

  const pauseWorkout = useCallback(() => {
    setWorkoutState('paused');
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    if (demoRef.current) clearInterval(demoRef.current);
  }, []);

  const resumeWorkout = useCallback(() => {
    setWorkoutState('active');
    timerRef.current = setInterval(() => {
      setActiveSeconds((s) => s + 1);
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    if (!isDemo) {
      analysisRef.current = setInterval(runAnalysis, 100);
    } else {
      demoRef.current = setInterval(() => {
        const frame = getDemoFrame(exercise);
        setResult(frame);
        if (frame.formScore > 0) setFormScoreHistory((prev) => [...prev.slice(-100), frame.formScore]);
        frame.warnings.forEach((w) => setFormErrorLog((prev) => ({ ...prev, [w]: (prev[w] || 0) + 1 })));
      }, 300);
    }
  }, [runAnalysis, isDemo, exercise]);

  const endWorkout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    if (demoRef.current) clearInterval(demoRef.current);
    setCameraActive(false);

    const avgFormScore = formScoreHistory.length > 0
      ? Math.round(formScoreHistory.reduce((a, b) => a + b, 0) / formScoreHistory.length)
      : result.formScore;

    const formIssues = Object.entries(formErrorLog)
      .filter(([, count]) => count > 2)
      .map(([issue, count]) => ({ issue, count: Math.ceil(count / 5) }));

    const session: WorkoutSession = {
      id: generateWorkoutId(),
      date: new Date().toISOString(),
      exercise,
      duration: activeSeconds,
      repCount: result.repCount,
      avgFormScore,
      movementQuality: result.movementQuality,
      riskLevel: result.riskLevel,
      fatigueLevel: result.fatigueLevel,
      formIssues,
      recommendations: [],
      subscores: result.subscores,
    };
    session.recommendations = generateRecommendations(session);
    setSessionData(session);
    setWorkoutState('summary');
  }, [formScoreHistory, formErrorLog, exercise, activeSeconds, result]);

  const handleSave = useCallback(() => {
    if (sessionData) {
      saveWorkout(sessionData);
    }
    setWorkoutState('setup');
    setResult(DEFAULT_RESULT);
    setSessionData(null);
  }, [sessionData]);

  const handleDiscard = useCallback(() => {
    setWorkoutState('setup');
    setResult(DEFAULT_RESULT);
    setSessionData(null);
  }, []);

  // Update analysis ref when runAnalysis changes
  useEffect(() => {
    if (workoutState === 'active' && !isDemo && analysisRef.current) {
      clearInterval(analysisRef.current);
      analysisRef.current = setInterval(runAnalysis, 100);
    }
  }, [runAnalysis, workoutState, isDemo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (analysisRef.current) clearInterval(analysisRef.current);
      if (demoRef.current) clearInterval(demoRef.current);
    };
  }, []);

  const handleExerciseChange = (ex: ExerciseType) => {
    if (workoutState === 'setup') {
      setExercise(ex);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Live Workout</h1>
          {workoutState !== 'setup' && (
            <p className="text-slate-400 text-sm">{getExerciseLabel(exercise)} · {formatDuration(elapsedSeconds)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {workoutState === 'setup' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${isDemo ? 'bg-yellow-500' : 'bg-slate-700'}`}
                onClick={() => setIsDemo((d) => !d)}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isDemo ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm flex items-center gap-1.5">
                <FlaskConical size={14} className="text-yellow-400" />
                <span className={isDemo ? 'text-yellow-400 font-medium' : 'text-slate-400'}>Demo Mode</span>
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Camera */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {workoutState === 'setup' ? (
            <div className="flex flex-col gap-4">
              {/* Exercise Selection */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Select Exercise</h3>
                <ExerciseSelector selected={exercise} onChange={handleExerciseChange} />
              </div>

              {/* Camera Setup Instructions */}
              {!isDemo && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3">Camera Setup</h3>
                  <div className="space-y-2 text-slate-400 text-sm">
                    {[
                      'Keep the camera stable at a fixed position.',
                      'Ensure your full body is visible in frame.',
                      'Stand in a well-lit environment.',
                      'Keep enough distance (2-3 meters) from the camera.',
                      'Make sure only one person is visible.',
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isDemo && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                    <FlaskConical size={16} /> Demo Mode Active
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Demo mode simulates realistic workout analysis without requiring a camera.
                    All data shown is simulated and clearly labelled. Switch off demo mode to use live webcam analysis.
                  </p>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startWorkout}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Play size={20} />
                Start Workout
              </button>
            </div>
          ) : (
            <>
              {!isDemo && (
                <CameraView
                  isActive={cameraActive && workoutState !== 'summary'}
                  onLandmarks={(lms) => { landmarksRef.current = lms; }}
                  mirrored={mirrored}
                  onMirrorToggle={() => setMirrored((m) => !m)}
                />
              )}
              {isDemo && (
                <div className="bg-slate-900 rounded-xl flex items-center justify-center border border-yellow-500/30"
                  style={{ aspectRatio: '4/3' }}>
                  <div className="text-center">
                    <FlaskConical size={48} className="text-yellow-400 mx-auto mb-3" />
                    <div className="text-yellow-400 font-bold text-lg">DEMO MODE</div>
                    <div className="text-slate-400 text-sm mt-1">Simulated pose analysis</div>
                    <div className="text-slate-500 text-xs mt-2">No camera required</div>
                  </div>
                </div>
              )}

              {/* Workout Controls */}
              <div className="flex gap-2">
                {workoutState === 'active' ? (
                  <button onClick={pauseWorkout} className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                    <Pause size={16} /> Pause
                  </button>
                ) : (
                  <button onClick={resumeWorkout} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                    <Play size={16} /> Resume
                  </button>
                )}
                <button onClick={endWorkout} className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  <Square size={16} /> End Workout
                </button>
                <button onClick={() => { resetAnalyzers(); setResult(DEFAULT_RESULT); }} className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors" title="Reset reps">
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Phase / Status bar */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${workoutState === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                  <span className="text-slate-300 text-sm font-medium capitalize">{result.phase}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-slate-500 text-xs">Duration</div>
                    <div className="text-white font-bold metric-number">{formatDuration(elapsedSeconds)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 text-xs">Exercise</div>
                    <div className="text-white font-bold">{getExerciseLabel(exercise)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Metrics */}
        {workoutState !== 'setup' && (
          <div className="w-72 flex-shrink-0 overflow-y-auto">
            <MetricsPanel result={result} isDemo={isDemo} />
          </div>
        )}
      </div>

      {/* Workout Summary Modal */}
      {workoutState === 'summary' && sessionData && (
        <WorkoutSummary
          session={sessionData}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};
