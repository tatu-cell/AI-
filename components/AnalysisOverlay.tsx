
import React from 'react';
import { ManualPins, Point, AnalysisViewMode, SidePins, RearPins } from '../types';

interface AnalysisOverlayProps {
  pins: ManualPins;
  mode: AnalysisViewMode;
  metrics: {
    elbowAngle?: number;
    lean?: number;
    tilt?: number;
  };
  isEditing: boolean;
  trajectory?: Point[];
}

const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({ pins, mode, metrics, isEditing, trajectory = [] }) => {
  const isRear = mode === AnalysisViewMode.REAR;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        {/* Trajectory Path - with smoother line */}
        {trajectory.length > 1 && (
          <polyline
            points={trajectory.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={isRear ? "#10b981" : "#3b82f6"}
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            className="opacity-60"
          />
        )}

        {mode === AnalysisViewMode.SIDE ? (
          <SideOverlay pins={pins as SidePins} elbowAngle={metrics.elbowAngle || 0} isEditing={isEditing} />
        ) : (
          <RearOverlay pins={pins as RearPins} lean={metrics.lean || 0} tilt={metrics.tilt || 0} isEditing={isEditing} />
        )}
      </svg>
    </div>
  );
};

const SideOverlay = ({ pins, elbowAngle, isEditing }: { pins: SidePins, elbowAngle: number, isEditing: boolean }) => (
  <>
    {/* Elbow Angle Visual Indicator */}
    <path 
      d={getAngleArc(pins.elbow, pins.shoulder, pins.hand, 40)} 
      fill="none" 
      stroke="#3b82f6" 
      strokeWidth="2" 
      className="opacity-60" 
    />
    
    <line x1={pins.shoulder.x} y1={pins.shoulder.y} x2={pins.elbow.x} y2={pins.elbow.y} stroke={isEditing ? "#fb923c" : "#3b82f6"} strokeWidth="5" strokeLinecap="round" className="opacity-80" />
    <line x1={pins.elbow.x} y1={pins.elbow.y} x2={pins.hand.x} y2={pins.hand.y} stroke={isEditing ? "#fb923c" : "#3b82f6"} strokeWidth="5" strokeLinecap="round" className="opacity-80" />
    
    <PinPoint p={pins.shoulder} label="S" color={isEditing ? "fill-orange-500" : "fill-blue-500"} isEditing={isEditing} />
    <PinPoint p={pins.elbow} label="E" color={isEditing ? "fill-orange-500" : "fill-blue-500"} isEditing={isEditing} />
    <PinPoint p={pins.hand} label="H" color={isEditing ? "fill-orange-500" : "fill-blue-500"} isEditing={isEditing} />
  </>
);

const RearOverlay = ({ pins, lean, tilt, isEditing }: { pins: RearPins, lean: number, tilt: number, isEditing: boolean }) => (
  <>
    {/* Spine Axis (T-B) */}
    <line x1={pins.head.x} y1={pins.head.y} x2={pins.pelvis.x} y2={pins.pelvis.y} stroke={isEditing ? "#fb923c" : "#10b981"} strokeWidth="5" strokeLinecap="round" className="opacity-80" />
    {/* Shoulder Line (L-R) */}
    <line x1={pins.shoulderL.x} y1={pins.shoulderL.y} x2={pins.shoulderR.x} y2={pins.shoulderR.y} stroke={isEditing ? "#fb923c" : "#8b5cf6"} strokeWidth="5" strokeLinecap="round" className="opacity-80" />
    
    {/* Top of Spine (Head) -> Changed from H to T */}
    <PinPoint p={pins.head} label="T" color="fill-green-500" isEditing={isEditing} />
    {/* Base of Spine (Pelvis) -> Changed from C to B */}
    <PinPoint p={pins.pelvis} label="B" color="fill-green-500" isEditing={isEditing} />
    
    <PinPoint p={pins.shoulderL} label="L" color="fill-purple-500" isEditing={isEditing} />
    <PinPoint p={pins.shoulderR} label="R" color="fill-purple-500" isEditing={isEditing} />
    
    {/* Throwing Hand -> Stays H */}
    <PinPoint p={pins.hand} label="H" color="fill-blue-500" isEditing={isEditing} />
  </>
);

const PinPoint = ({ p, label, color, isEditing }: { p: Point, label: string, color: string, isEditing: boolean }) => (
  <g>
    <circle cx={p.x} cy={p.y} r={isEditing ? "40" : "12"} className={`${color} ${isEditing ? 'opacity-20 animate-pulse' : 'opacity-30'}`} />
    <circle cx={p.x} cy={p.y} r="7" className={`${color} stroke-white stroke-[2px] shadow-lg`} />
    {isEditing && (
      <text x={p.x} y={p.y - 45} textAnchor="middle" className="fill-white text-[22px] font-black pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">{label}</text>
    )}
  </g>
);

// Helper to create an SVG arc for angle visualization
function getAngleArc(center: Point, p1: Point, p2: Point, radius: number): string {
  const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);
  
  const x1 = center.x + radius * Math.cos(startAngle);
  const y1 = center.y + radius * Math.sin(startAngle);
  const x2 = center.x + radius * Math.cos(endAngle);
  const y2 = center.y + radius * Math.sin(endAngle);
  
  const angleDiff = endAngle - startAngle;
  const largeArcFlag = Math.abs(angleDiff) > Math.PI ? 1 : 0;
  
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${angleDiff > 0 ? 1 : 0} ${x2} ${y2}`;
}

export default AnalysisOverlay;
