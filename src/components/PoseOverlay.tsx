import React, { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '../pose/landmarkUtils';
import { POSE_CONNECTIONS, toPixelPoint } from '../pose/landmarkUtils';

interface Props {
  landmarks: NormalizedLandmark[] | null;
  width: number;
  height: number;
  mirrored?: boolean;
  confidence?: number;
}

// Color for landmarks by body part
function getLandmarkColor(index: number): string {
  if (index <= 10) return '#f59e0b'; // face
  if (index <= 16) return '#3b82f6'; // arms
  if (index <= 22) return '#8b5cf6'; // hands
  if (index <= 28) return '#10b981'; // legs
  return '#06b6d4'; // feet
}

export const PoseOverlay: React.FC<Props> = ({ landmarks, width, height, mirrored, confidence }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) return;

    ctx.save();
    if (mirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Draw connections
    for (const [a, b] of POSE_CONNECTIONS) {
      const lmA = landmarks[a];
      const lmB = landmarks[b];
      if (!lmA || !lmB) continue;
      if ((lmA.visibility ?? 1) < 0.3 || (lmB.visibility ?? 1) < 0.3) continue;

      const pA = toPixelPoint(lmA, width, height);
      const pB = toPixelPoint(lmB, width, height);

      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.strokeStyle = 'rgba(59,130,246,0.7)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 1) < 0.3) continue;
      const p = toPixelPoint(lm, width, height);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = getLandmarkColor(i);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();

    // Confidence overlay
    if (confidence !== undefined) {
      const confText = `Confidence: ${Math.round(confidence * 100)}%`;
      ctx.fillStyle = confidence > 0.6 ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(confText, 8, height - 10);
    }
  }, [landmarks, width, height, mirrored, confidence]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};
