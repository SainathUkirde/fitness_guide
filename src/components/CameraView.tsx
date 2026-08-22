import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, FlipHorizontal, Loader } from 'lucide-react';
import { PoseOverlay } from './PoseOverlay';
import {
  initPoseDetector,
  detectPose,
  isPoseDetectorReady,
  getPoseLoadError,
} from '../pose/poseDetector';
import {
  getPoseConfidence,
  isFullBodyVisible,
  type NormalizedLandmark,
} from '../pose/landmarkUtils';

interface Props {
  onLandmarks: (landmarks: NormalizedLandmark[] | null) => void;
  isActive: boolean;
  mirrored: boolean;
  onMirrorToggle: () => void;
  onCameraReady?: () => void;
  onSwitchToDemo?: () => void;
  selectedCamera?: string;
}

export const CameraView: React.FC<Props> = ({
  onLandmarks,
  isActive,
  mirrored,
  onMirrorToggle,
  onCameraReady,
  onSwitchToDemo,
  selectedCamera,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const onLandmarksRef = useRef(onLandmarks);
  const mountedRef = useRef(true);

  // Keep onLandmarks ref current without causing re-runs
  onLandmarksRef.current = onLandmarks;

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [poseLoading, setPoseLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const videoDims = { width: 640, height: 480 };

  // Detection loop — stored in a ref so it never causes stale closures
  const detectionLoopRef = useRef<() => void>(() => {});
  detectionLoopRef.current = () => {
    if (!videoRef.current || !isPoseDetectorReady() || !mountedRef.current) return;
    const result = detectPose(videoRef.current);
    if (result && result.landmarks && result.landmarks.length > 0) {
      const lms = result.landmarks[0] as NormalizedLandmark[];
      const conf = getPoseConfidence(lms);
      setConfidence(conf);
      setLandmarks(lms);
      onLandmarksRef.current(lms);
      if (conf < 0.4) {
        setStatusMsg('Poor lighting or body not fully visible.');
      } else if (!isFullBodyVisible(lms)) {
        setStatusMsg('Move farther away so your full body is visible.');
      } else {
        setStatusMsg('');
      }
    } else {
      setLandmarks(null);
      onLandmarksRef.current(null);
      setStatusMsg('No person detected. Move into the camera frame.');
    }
    animFrameRef.current = requestAnimationFrame(() => detectionLoopRef.current());
  };

  const stopCamera = () => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setLandmarks(null);
    onLandmarksRef.current(null);
  };

  const startCamera = async () => {
    setStatus('loading');
    setPoseLoading(false);
    setErrorMsg('');
    try {
      // Wrap getUserMedia in a 15-second timeout so we never hang forever
      const getUserMediaWithTimeout = (): Promise<MediaStream> => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new DOMException('Camera took too long to start. Close other apps using the camera and try again.', 'TimeoutError'));
          }, 15000);
          const constraints: MediaStreamConstraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
              ...(selectedCamera ? { deviceId: { exact: selectedCamera } } : {}),
            },
          };
          navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            clearTimeout(timer);
            resolve(stream);
          }).catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
        });
      };

      const stream = await getUserMediaWithTimeout();
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!isPoseDetectorReady()) {
        setPoseLoading(true);
        await initPoseDetector();
        if (!mountedRef.current) return;
        setPoseLoading(false);
      }

      if (!mountedRef.current) return;
      setStatus('ready');
      onCameraReady?.();
      animFrameRef.current = requestAnimationFrame(() => detectionLoopRef.current());
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setPoseLoading(false);
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setErrorMsg('Camera access denied. Click the 🔒 lock icon in the address bar and set Camera to Allow, then try again.');
      } else if (e.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device. Connect a camera or use Demo Mode instead.');
      } else if (e.name === 'NotReadableError') {
        setErrorMsg('Camera is in use by another app (Teams, Zoom, etc.). Close those apps and try again.');
      } else if (e.name === 'TimeoutError') {
        setErrorMsg(e.message);
      } else if (e.name === 'OverconstrainedError') {
        setErrorMsg('Camera settings not supported by this device. Try again.');
      } else {
        const loadErr = getPoseLoadError();
        setErrorMsg(loadErr || `Camera error: ${e.message}. Try refreshing the page or use Demo Mode.`);
      }
      setStatus('error');
    }
  };

  // Only run once when isActive flips — avoid re-triggering on every render
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    const wasActive = isActiveRef.current;
    isActiveRef.current = isActive;

    if (isActive && !wasActive) {
      // Became active
      startCamera();
    } else if (!isActive && wasActive) {
      // Became inactive
      stopCamera();
      setStatus('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Cleanup on unmount only
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
        muted
        playsInline
      />

      {status === 'ready' && (
        <PoseOverlay
          landmarks={landmarks}
          width={videoDims.width}
          height={videoDims.height}
          mirrored={mirrored}
          confidence={confidence}
        />
      )}

      {/* Idle */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
          <CameraOff size={48} className="text-slate-600 mb-4" />
          <p className="text-slate-400 text-sm">Camera is off</p>
          <button
            onClick={startCamera}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Start Camera
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
          <Loader size={36} className="text-blue-400 animate-spin mb-3" />
          <p className="text-slate-300 text-sm">
            {poseLoading ? 'Loading AI pose model (~5 MB)…' : 'Starting camera…'}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {poseLoading ? 'Downloading from CDN, please wait…' : 'Requesting camera permission…'}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 px-6 text-center gap-3">
          <CameraOff size={48} className="text-red-400" />
          <p className="text-red-400 text-sm font-medium leading-relaxed max-w-xs">{errorMsg}</p>
          <div className="flex flex-col gap-2 w-full max-w-xs mt-1">
            <button
              onClick={startCamera}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
            {onSwitchToDemo && (
              <button
                onClick={onSwitchToDemo}
                className="w-full px-4 py-2.5 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ⚡ Use Demo Mode Instead
              </button>
            )}
          </div>
          <p className="text-slate-600 text-xs max-w-xs">
            Demo Mode simulates full workout analysis without a camera.
          </p>
        </div>
      )}

      {/* Pose status overlay */}
      {status === 'ready' && statusMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 text-yellow-400 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm max-w-[90%] text-center">
          {statusMsg}
        </div>
      )}

      {/* LIVE indicator */}
      {status === 'ready' && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
          <Camera size={12} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">LIVE</span>
        </div>
      )}

      {/* Mirror button */}
      <button
        onClick={onMirrorToggle}
        className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
        title="Mirror camera"
      >
        <FlipHorizontal size={16} />
      </button>

      {/* Privacy notice */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-slate-400 text-[10px] px-2 py-1 rounded backdrop-blur-sm max-w-[60%]">
        🔒 Processing locally — no video stored
      </div>
    </div>
  );
};
