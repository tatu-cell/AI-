
export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW'
}

export enum AnalysisViewMode {
  SIDE = 'side',
  REAR = 'back'
}

export interface Point {
  x: number;
  y: number;
}

export interface SidePins {
  shoulder: Point;
  elbow: Point;
  hand: Point;
}

export interface RearPins {
  head: Point;
  pelvis: Point;
  shoulderL: Point;
  shoulderR: Point;
  hand: Point;
}

export type ManualPins = SidePins | RearPins;

export interface Keyframe {
  timestamp: number;
  pins: ManualPins;
  mode: AnalysisViewMode;
}

export interface AnalysisResult {
  keyframes: Keyframe[];
  velocity: number;
  maxVelocity: number;
  trajectory: Point[];
  feedback: string;
  suggestions: string[];
  postureScore: number;
  trajectoryConsistency: number;
}

export interface VideoMetadata {
  id: string;
  url: string;
  name: string;
  timestamp: number;
  memos: string;
}

export interface ResearchRecord {
  id: string;
  date: string;
  videoPath: string;
  viewType: AnalysisViewMode;
  maxHandSpeed: number | null;
  releaseAngle: number | null;
  trunkDeviationAngle: number | null;
  shoulderDeviationAngle: number | null;
  memo: string | null;
}

export type AnalysisTab = 'solo_side' | 'solo_rear' | 'compare' | 'history' | 'stats';
