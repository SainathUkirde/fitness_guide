# SportSense AI

> **Your AI-Powered Real-Time Fitness Coach**

A complete browser-based AI sports performance and movement-risk assessment prototype using computer vision, pose estimation, and real-time feedback — all running locally with no server, no API keys, and no external hardware.

---

## Problem Statement

Athletes and fitness users frequently perform exercises incorrectly because professional supervision is not continuously available. Incorrect movement can:

- Reduce exercise effectiveness
- Create poor long-term movement habits
- Decrease training performance

**SportSense AI** uses computer vision and pose estimation to analyze exercise movements in real time and provide corrective feedback without any external hardware.

---

## Solution

A web application that:

1. Accesses the user's webcam via the browser WebRTC API
2. Runs MediaPipe Pose Landmarker entirely in the browser (no server)
3. Tracks 33 body landmarks at near real-time frame rates
4. Calculates joint angles from landmark positions
5. Classifies exercise phase using a state-machine approach
6. Counts repetitions reliably with phase transitions
7. Scores form quality from 0–100 based on multiple movement dimensions
8. Provides live AI coaching feedback text
9. Displays movement-risk indicators with plain-language explanations
10. Saves workout summaries to LocalStorage for historical tracking

---

## Features

| Feature | Description |
|---|---|
| **Live Pose Detection** | MediaPipe Pose Landmarker with skeleton overlay on video feed |
| **4 Exercises** | Squat, Push-Up, Bicep Curl, Jumping Jack |
| **Rep Counting** | State-machine based, prevents duplicate counting |
| **Joint Angle Engine** | Real geometric calculation from detected landmarks |
| **Form Score (0–100)** | Posture, Range of Motion, Stability, Symmetry, Control |
| **Movement Quality Score** | Weighted aggregate of form dimensions |
| **Movement-Risk Indicator** | Rule-based, LOW / MODERATE / HIGH with explanations |
| **Fatigue Indicator** | Based on rep-duration consistency changes |
| **AI Coach Feedback** | Real-time text feedback based on detected movement |
| **Demo Mode** | Full simulation without camera for demonstrations |
| **Workout Summary** | Duration, reps, form score, risk, form issues, AI recommendations |
| **Workout History** | LocalStorage, expandable detail rows |
| **Analytics** | Recharts line/bar/pie charts for form, reps, exercise distribution |
| **Exercise Guide** | Instructions, common mistakes, form tips for all exercises |
| **Settings** | Camera selection, feedback frequency, clear history |
| **Responsive** | Desktop, laptop, tablet supported |

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite 8 | Build tool and dev server |
| Tailwind CSS v4 | Styling |
| MediaPipe Tasks-Vision | Browser-based pose estimation |
| Recharts | Analytics charts |
| Lucide React | Icons |
| React Router DOM | Client-side routing |
| LocalStorage | Workout history persistence |

---

## System Architecture

```
Browser
├── WebRTC Camera API → video element
├── MediaPipe Pose Landmarker (WASM + GPU delegate)
│   └── returns 33 normalized landmarks per frame
├── Landmark Utilities
│   ├── visibility filtering
│   ├── full-body detection
│   └── pixel coordinate conversion
├── Joint Angle Engine
│   └── calculateAngle(A, B, C) → degrees at joint B
├── Exercise Analyzers (state machines)
│   ├── SquatAnalyzer
│   ├── PushUpAnalyzer
│   ├── BicepCurlAnalyzer
│   └── JumpingJackAnalyzer
├── Scoring Engine
│   ├── formScore (posture, ROM, stability, symmetry, control)
│   ├── movementQuality (weighted composite)
│   ├── riskLevel (rule-based 0–100 → LOW/MODERATE/HIGH)
│   └── fatigueLevel (rep duration trend analysis)
├── React UI (requestAnimationFrame loop)
│   ├── CameraView (video + canvas overlay)
│   ├── PoseOverlay (draws skeleton on canvas)
│   └── MetricsPanel (live scores)
└── LocalStorage
    └── WorkoutStorage (CRUD for WorkoutSession objects)
```

---

## How Pose Detection Works

MediaPipe Pose Landmarker runs as a WASM module with optional GPU acceleration in the browser. Each video frame is sent to `detectForVideo(videoElement, timestamp)` which returns an array of 33 landmarks, each with:

- `x`, `y` — normalized to [0, 1] relative to frame dimensions
- `z` — depth estimate
- `visibility` — confidence [0, 1]

Landmarks with `visibility < 0.3` are filtered out before analysis.

---

## How Joint Angles Are Calculated

```typescript
function calculateAngle(A, B, C): number {
  // B is the joint vertex
  const radians = atan2(C.y - B.y, C.x - B.x)
                - atan2(A.y - B.y, A.x - B.x);
  let angle = |radians × (180 / π)|;
  if (angle > 180) angle = 360 - angle;
  return angle; // 0–180 degrees
}
```

Example: `calculateAngle(hip, knee, ankle)` → knee flexion angle.

---

## How Repetition Counting Works

Each exercise uses a **state machine** with defined phase transitions:

```
Squat:
  standing → descending → bottom → ascending → standing → REP+1

Push-Up:
  top → descending → bottom → ascending → top → REP+1

Bicep Curl:
  extended → curling → contracted → extending → extended → REP+1

Jumping Jack:
  closed → opening → open → closing → closed → REP+1
```

A rep is counted only when the **complete cycle** transitions back to the starting phase. This prevents counting on every frame or on partial movements.

---

## How Movement Scoring Works

### Form Score Components

| Dimension | Description |
|---|---|
| Posture | Measures torso lean, body alignment |
| Range of Motion | How deep/full the movement is |
| Stability | Consistency — fewer form errors = higher score |
| Symmetry | Left/right angle difference |
| Control | Rep duration consistency |

### Weightings

| Dimension | Weight in Movement Quality |
|---|---|
| Form | 30% |
| Range of Motion | 20% |
| Stability | 20% |
| Symmetry | 15% |
| Control | 15% |

---

## How Risk Indicators Work

> **IMPORTANT: This is not medical diagnosis. These are experimental movement heuristics.**

Risk indicators are rule-based heuristics. Each detected issue adds a numerical penalty to a risk score:

| Indicator | Risk Score Addition |
|---|---|
| Excessive torso lean (>35°) | +25 |
| Limited range of motion | +15 |
| Significant asymmetry (>20°) | +20 |
| Repeated form errors (≥3) | +20 |

**Final classification:**
- 0–30 → **LOW**
- 31–60 → **MODERATE**
- 61–100 → **HIGH**

Every risk indicator is displayed with a plain-language explanation of why the level increased.

> *Movement-risk indicators are experimental fitness feedback and are not a medical diagnosis or substitute for professional coaching.*

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd sportsense-ai

# Install dependencies
npm install
```

---

## Running

```bash
# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

**First use:**
1. Grant camera permissions when prompted
2. Allow a few seconds for the MediaPipe model to load (~5 MB from CDN)
3. Stand 2–3 meters from the camera so your full body is visible

**Demo Mode** (no camera required):
1. Go to **Live Workout**
2. Toggle **Demo Mode** on
3. Select an exercise and click **Start Workout**

---

## Limitations

- MediaPipe model loads from CDN on first use — requires internet on first load
- Pose estimation accuracy varies with lighting, camera angle, and clothing
- Joint angle calculations assume a roughly front-facing camera view
- The GPU delegate may fall back to CPU on some browsers (reduced performance)
- Exercise analyzers are calibrated for a single person visible from roughly 2–3 meters
- Risk indicators are heuristic estimates, not validated clinical measurements
- Jumping Jack analyzer works best when the full body (arms + legs) is visible

---

## Future Scope

- Offline model caching with Service Workers
- Additional exercises (lunges, deadlifts, plank)
- Voice coaching feedback using Web Speech API
- Video recording + playback with pose overlay
- Multi-set workout planning
- Progressive overload tracking
- Export to CSV/PDF
- Side-view pose analysis for sagittal plane assessment
- Calibration wizard for different body types

---

## Privacy

Camera processing happens entirely in your browser using WebAssembly. No video frames are ever transmitted to a server. Only numerical workout results (rep counts, scores, timestamps) are stored locally in your browser's LocalStorage. Clearing browser data removes all stored workout history.

---

*SportSense AI is a prototype. Movement-risk assessments are experimental fitness heuristics and are not a medical diagnosis or substitute for professional coaching.*
