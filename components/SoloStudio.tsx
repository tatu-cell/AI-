
import { ChevronLeft, ChevronRight, Crosshair, Pause, Play, StickyNote, Upload, X, ZoomIn, ZoomOut, Maximize, Flag, RotateCcw, Eye, EyeOff, Save, SkipBack, Target, CheckCircle, Download, FileJson } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnalysisViewMode, AppState, Keyframe, ManualPins, Point, RearPins, SidePins, ResearchRecord } from '../types';
import AnalysisOverlay from './AnalysisOverlay';

const INITIAL_SIDE_PINS: SidePins = {
  shoulder: { x: 400, y: 300 },
  elbow: { x: 450, y: 450 },
  hand: { x: 500, y: 600 }
};

const INITIAL_REAR_PINS: RearPins = {
  head: { x: 500, y: 200 },
  pelvis: { x: 500, y: 600 },
  shoulderL: { x: 400, y: 300 },
  shoulderR: { x: 600, y: 300 },
  hand: { x: 550, y: 700 }
};

const FRAME_TIME = 1 / 30; // 30fps assumption

interface SoloStudioProps {
  mode: AnalysisViewMode;
  initialVideo?: string | null;
}

const SoloStudio: React.FC<SoloStudioProps> = ({ mode, initialVideo }) => {
  const [video, setVideo] = useState<string | null>(initialVideo || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [motionStart, setMotionStart] = useState<number | null>(null);
  const [motionRelease, setMotionRelease] = useState<number | null>(null);
  
  const [draggingPin, setDraggingPin] = useState<string | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [memo, setMemo] = useState("");
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingView, setIsDraggingView] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleTimeUpdate = () => setCurrentTime(v.currentTime);
    const handleLoadedMetadata = () => setDuration(v.duration);
    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [video]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const currentModeKeyframes = useMemo(() => 
    keyframes.filter(kf => kf.mode === mode).sort((a, b) => a.timestamp - b.timestamp),
    [keyframes, mode]
  );

  const interpolatedPins = useMemo(() => {
    const defaultPins = mode === AnalysisViewMode.SIDE ? INITIAL_SIDE_PINS : INITIAL_REAR_PINS;
    if (currentModeKeyframes.length === 0) return defaultPins;
    
    const exactKf = currentModeKeyframes.find(kf => Math.abs(kf.timestamp - currentTime) < 0.015);
    if (exactKf) return exactKf.pins;

    const nextIdx = currentModeKeyframes.findIndex(kf => kf.timestamp > currentTime);
    if (nextIdx === 0) return currentModeKeyframes[0].pins;
    if (nextIdx === -1) return currentModeKeyframes[currentModeKeyframes.length - 1].pins;
    
    const prev = currentModeKeyframes[nextIdx - 1];
    const next = currentModeKeyframes[nextIdx];
    
    const t = (currentTime - prev.timestamp) / (next.timestamp - prev.timestamp);
    const lerp = (p1: Point, p2: Point) => ({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    });

    const result: any = {};
    Object.keys(prev.pins).forEach(key => {
      result[key] = lerp((prev.pins as any)[key], (next.pins as any)[key]);
    });
    return result as ManualPins;
  }, [currentModeKeyframes, currentTime, mode]);

  const stats = useMemo(() => {
    const targetKeyframes = currentModeKeyframes;
    const idx = targetKeyframes.findIndex(kf => kf.timestamp >= currentTime);
    let velocity = 0;
    let elbowAngle = 0;
    let lean = 0;
    let tilt = 0;

    const kfAtTime = targetKeyframes[idx] || targetKeyframes[targetKeyframes.length - 1];
    const p = kfAtTime?.pins || (mode === AnalysisViewMode.SIDE ? INITIAL_SIDE_PINS : INITIAL_REAR_PINS);

    if (idx > 0) {
      const k1 = targetKeyframes[idx - 1];
      const k2 = targetKeyframes[idx];
      const dt = k2.timestamp - k1.timestamp;
      if (dt > 0) {
        const dist = Math.sqrt((k2.pins.hand.x - k1.pins.hand.x)**2 + (k2.pins.hand.y - k1.pins.hand.y)**2);
        velocity = (dist / 1000 * 2) / dt;
      }
    }

    if (mode === AnalysisViewMode.SIDE) {
      const sp = p as SidePins;
      const a1 = Math.atan2(sp.shoulder.y - sp.elbow.y, sp.shoulder.x - sp.elbow.x);
      const a2 = Math.atan2(sp.hand.y - sp.elbow.y, sp.hand.x - sp.elbow.x);
      elbowAngle = Math.abs((a1 - a2) * 180 / Math.PI);
      if (elbowAngle > 180) elbowAngle = 360 - elbowAngle;
    } else {
      const rp = p as RearPins;
      lean = Math.atan2(rp.head.x - rp.pelvis.x, rp.pelvis.y - rp.head.y) * 180 / Math.PI;
      tilt = Math.atan2(rp.shoulderR.y - rp.shoulderL.y, rp.shoulderR.x - rp.shoulderL.x) * 180 / Math.PI;
    }

    return { velocity, elbowAngle, lean, tilt };
  }, [currentModeKeyframes, currentTime, mode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left - offset.x) / zoom / rect.width) * 1000;
    const y = ((e.clientY - rect.top - offset.y) / zoom / rect.height) * 1000;

    if (appState === AppState.ANALYZING && showMarkers) {
      const threshold = (80 / rect.width * 1000) / zoom;
      let found = false;
      for (const key of Object.keys(interpolatedPins)) {
        const pin = (interpolatedPins as any)[key];
        const dist = Math.sqrt((pin.x - x)**2 + (pin.y - y)**2);
        if (dist < threshold) { setDraggingPin(key); found = true; break; }
      }
      if (found) return;
    }
    
    setIsDraggingView(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingPin && appState === AppState.ANALYZING) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left - offset.x) / zoom / rect.width) * 1000;
      const y = ((e.clientY - rect.top - offset.y) / zoom / rect.height) * 1000;
      const updatedPins = { ...interpolatedPins, [draggingPin]: { x, y } };
      
      setKeyframes(prev => {
        const filtered = prev.filter(kf => !(Math.abs(kf.timestamp - currentTime) < 0.05 && kf.mode === mode));
        return [...filtered, { timestamp: currentTime, pins: updatedPins, mode: mode }].sort((a, b) => a.timestamp - b.timestamp);
      });
    } else if (isDraggingView) {
      setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const stepFrame = (frames: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += frames * FRAME_TIME;
    }
  };

  const createRecord = () => {
    let maxVelocity = 0;
    for (let i = 1; i < currentModeKeyframes.length; i++) {
      const k1 = currentModeKeyframes[i - 1];
      const k2 = currentModeKeyframes[i];
      const dt = k2.timestamp - k1.timestamp;
      if (dt > 0) {
        const dist = Math.sqrt((k2.pins.hand.x - k1.pins.hand.x)**2 + (k2.pins.hand.y - k1.pins.hand.y)**2);
        const v = (dist / 1000 * 2) / dt;
        if (v > maxVelocity) maxVelocity = v;
      }
    }

    let releaseMetrics = { elbow: null, lean: null, tilt: null };
    if (motionRelease !== null) {
      const releaseKf = currentModeKeyframes.find(kf => Math.abs(kf.timestamp - motionRelease) < 0.1) || 
                        currentModeKeyframes.reduce((prev, curr) => 
                          Math.abs(curr.timestamp - motionRelease) < Math.abs(prev.timestamp - motionRelease) ? curr : prev
                        , currentModeKeyframes[0]);

      if (releaseKf) {
        if (mode === AnalysisViewMode.SIDE) {
          const sp = releaseKf.pins as SidePins;
          const a1 = Math.atan2(sp.shoulder.y - sp.elbow.y, sp.shoulder.x - sp.elbow.x);
          const a2 = Math.atan2(sp.hand.y - sp.elbow.y, sp.hand.x - sp.elbow.x);
          let angle = Math.abs((a1 - a2) * 180 / Math.PI);
          if (angle > 180) angle = 360 - angle;
          releaseMetrics.elbow = angle as any;
        } else {
          const rp = releaseKf.pins as RearPins;
          releaseMetrics.lean = (Math.atan2(rp.head.x - rp.pelvis.x, rp.pelvis.y - rp.head.y) * 180 / Math.PI) as any;
          releaseMetrics.tilt = (Math.atan2(rp.shoulderR.y - rp.shoulderL.y, rp.shoulderR.x - rp.shoulderL.x) * 180 / Math.PI) as any;
        }
      }
    }

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: new Date().toISOString(),
      videoPath: video || "local_file",
      viewType: mode,
      maxHandSpeed: maxVelocity > 0 ? maxVelocity : null,
      releaseAngle: mode === AnalysisViewMode.SIDE ? releaseMetrics.elbow : null,
      trunkDeviationAngle: mode === AnalysisViewMode.REAR ? releaseMetrics.lean : null,
      shoulderDeviationAngle: mode === AnalysisViewMode.REAR ? releaseMetrics.tilt : null,
      memo: memo.trim() || null,
      keyframes: currentModeKeyframes
    };
  };

  const handleSaveRecord = async () => {
    if (!video) return;
    setIsSaving(true);
    try {
      const newRecord = createRecord();
      const existing = JSON.parse(localStorage.getItem('boccia_research_records') || '[]');
      localStorage.setItem('boccia_research_records', JSON.stringify([...existing, newRecord]));
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const record = createRecord();
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boccia_record_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const jumpToPoint = (time: number | null) => {
    if (time !== null && videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleFullReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("解析データを消去しますか？")) {
      setKeyframes([]);
      setMotionStart(null);
      setMotionRelease(null);
      setMemo("");
      setAppState(AppState.IDLE);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div 
        ref={containerRef}
        className={`flex-1 relative bg-black overflow-hidden flex items-start justify-start touch-none select-none ${appState === AppState.ANALYZING ? 'cursor-crosshair' : (zoom > 1 ? 'cursor-grab' : 'cursor-default')}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { setDraggingPin(null); setIsDraggingView(false); }}
      >
        <div className="w-full h-full transition-transform duration-75 pointer-events-none" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {video ? (
            <div className="relative w-full h-full">
               <video ref={videoRef} src={video} className="w-full h-full object-contain" playsInline muted loop />
               {showMarkers && (
                 <AnalysisOverlay 
                    pins={interpolatedPins} 
                    mode={mode} 
                    metrics={stats} 
                    isEditing={appState === AppState.ANALYZING} 
                    trajectory={currentModeKeyframes.map(kf => kf.pins.hand)} 
                 />
               )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center pointer-events-auto bg-slate-900/40">
              <label className="flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-colors p-12 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Upload className="w-16 h-16 text-blue-500 mb-6" />
                <span className="text-xl font-black uppercase tracking-widest text-center mb-2">Upload Analysis MP4</span>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Select video from local storage</p>
                <input type="file" className="hidden" accept="video/mp4,video/quicktime" onChange={(e) => { const file = e.target.files?.[0]; if (file) setVideo(URL.createObjectURL(file)); }} />
              </label>
            </div>
          )}
        </div>

        {/* HUD Stats */}
        {showMarkers && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-2">
            <div className="bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-2xl flex gap-6">
              <div>
                <span className="text-[8px] font-black text-slate-500 block mb-1 uppercase tracking-tighter">
                  {mode === AnalysisViewMode.SIDE ? 'Dynamic Velocity' : 'Trunk Angle'}
                </span>
                <div className={`text-lg font-mono font-black ${mode !== AnalysisViewMode.SIDE ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {mode === AnalysisViewMode.SIDE ? stats.velocity.toFixed(2) : Math.abs(stats.lean).toFixed(1)}
                  <span className="text-[10px] text-slate-500 ml-1">{mode === AnalysisViewMode.SIDE ? 'm/s' : '°'}</span>
                </div>
              </div>
              <div className="border-l border-slate-800 pl-6">
                <span className="text-[8px] font-black text-slate-500 block mb-1 uppercase tracking-tighter">
                  {mode === AnalysisViewMode.SIDE ? 'Elbow Extension' : 'Shoulder Tilt'}
                </span>
                <div className={`text-lg font-mono font-black ${mode === AnalysisViewMode.SIDE ? 'text-indigo-400' : 'text-purple-400'}`}>
                  {mode === AnalysisViewMode.SIDE ? stats.elbowAngle.toFixed(1) : stats.tilt.toFixed(1)}
                  <span className="text-[10px] text-slate-500 ml-1">°</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSavedToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full shadow-2xl animate-in zoom-in duration-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Record Saved</span>
          </div>
        )}

        {isMemoOpen && (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm pointer-events-auto px-6">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Analysis Note</span>
                </div>
                <button onClick={() => setIsMemoOpen(false)} className="p-2 text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <textarea autoFocus value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="気づきをメモ..." className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none resize-none mb-4" />
              <button onClick={() => setIsMemoOpen(false)} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Close & Save</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-4 pb-12 z-40">
        <div className="max-w-4xl mx-auto space-y-4">
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
               <button onClick={() => setZoom(prev => Math.min(5, prev + 0.5))} className="p-2 text-slate-400 hover:text-white transition-colors"><ZoomIn className="w-5 h-5" /></button>
               <button onClick={() => {setZoom(1); setOffset({x:0, y:0});}} className="p-2 text-slate-400 hover:text-white transition-colors"><Maximize className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-1">
              <button onClick={() => setAppState(appState === AppState.ANALYZING ? AppState.IDLE : AppState.ANALYZING)} className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${appState === AppState.ANALYZING ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                <Crosshair className="w-4 h-4" /> Marker Mode
              </button>
              <button onClick={() => setShowMarkers(!showMarkers)} className={`p-2 rounded-xl border ${showMarkers ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-slate-950 text-slate-700 border-slate-800'}`}>
                {showMarkers ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setIsMemoOpen(true)} className={`p-2 rounded-xl border ${memo.trim() ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-500 border-slate-800'}`} title="Memo"><StickyNote className="w-5 h-5" /></button>
              <button onClick={handleFullReset} className="p-2 bg-slate-950 text-red-600 border border-red-900/40 rounded-xl hover:bg-red-950 transition-colors" title="Reset Analysis"><RotateCcw className="w-5 h-5" /></button>
              <div className="h-full w-[1px] bg-slate-800 mx-1" />
              <button onClick={handleExportJson} disabled={!video} className="p-2 bg-slate-950 text-slate-400 border border-slate-800 rounded-xl hover:text-blue-400 transition-colors" title="Export JSON"><FileJson className="w-5 h-5" /></button>
              <button 
                onClick={handleSaveRecord} 
                disabled={isSaving || !video}
                className={`px-6 py-2 rounded-xl border flex items-center gap-2 transition-all ${video ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg active:scale-95' : 'bg-slate-950 text-slate-800 border-slate-800'}`}
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Save Record</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
              <span className="text-[8px] font-black text-slate-700 px-2 flex items-center uppercase">Speed</span>
              {[0.1, 0.25, 0.5, 1, 2].map(rate => (
                <button key={rate} onClick={() => setPlaybackRate(rate)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${playbackRate === rate ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-300'}`}>{rate}x</button>
              ))}
            </div>

            <div className="flex gap-2 flex-1 justify-end">
               <button onClick={() => setMotionStart(currentTime)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border transition-all ${motionStart !== null ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                 <Flag className="w-3.5 h-3.5" /> Start Pt
               </button>
               <button onClick={() => setMotionRelease(currentTime)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border transition-all ${motionRelease !== null ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                 <Target className="w-3.5 h-3.5" /> Release Pt
               </button>
            </div>
          </div>

          <div className="px-1 relative h-6 flex items-center mt-2 group">
            <div className="absolute inset-0 pointer-events-none px-1">
              {motionStart !== null && (
                <div className="absolute w-0.5 h-full bg-emerald-400 top-0 shadow-[0_0_10px_#34d399] z-20" style={{ left: `${(motionStart / duration) * 100}%` }} />
              )}
              {motionRelease !== null && (
                <div className="absolute w-0.5 h-full bg-blue-400 top-0 shadow-[0_0_10px_#60a5fa] z-20" style={{ left: `${(motionRelease / duration) * 100}%` }} />
              )}
            </div>
            <input type="range" min="0" max={duration || 1} step="0.001" value={currentTime} onChange={(e) => {if(videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value);}} className="w-full h-1.5 bg-slate-950 rounded-full accent-white appearance-none relative z-10 cursor-pointer" />
          </div>

          <div className="flex justify-between text-[10px] font-mono font-black text-slate-500 px-1 uppercase tracking-widest">
            <span className="text-white bg-slate-800 px-2 py-0.5 rounded-md">{currentTime.toFixed(3)}s</span>
            <div className="flex gap-8">
              {motionStart !== null && <span className="text-emerald-500">Duration: {(currentTime - motionStart).toFixed(3)}s</span>}
              {motionRelease !== null && <span className="text-blue-500">Offset to Release: {(currentTime - motionRelease).toFixed(3)}s</span>}
            </div>
            <span>{duration.toFixed(3)}s</span>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
             <div className="flex items-center gap-2">
               <button onClick={() => stepFrame(-1)} className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 active:scale-95 transition-all" title="Previous Frame (1/30s)">
                 <ChevronLeft className="w-6 h-6" />
                 <span className="text-[6px] font-black block text-center -mt-1 uppercase">Frame</span>
               </button>
               <button onClick={() => jumpToPoint(motionStart)} className={`p-4 rounded-2xl transition-all ${motionStart !== null ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-800 bg-slate-900/40'}`}><SkipBack className="w-8 h-8" /></button>
             </div>

             <button onClick={() => {if(isPlaying) videoRef.current?.pause(); else videoRef.current?.play(); setIsPlaying(!isPlaying);}} className="w-20 h-20 bg-white text-slate-950 rounded-[2rem] flex items-center justify-center shadow-[0_15px_30px_rgba(255,255,255,0.1)] active:scale-90 transition-all border-b-4 border-slate-300">
               {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
             </button>

             <div className="flex items-center gap-2">
               <button onClick={() => jumpToPoint(motionRelease)} className={`p-4 rounded-2xl transition-all ${motionRelease !== null ? 'text-blue-400 bg-blue-400/10' : 'text-slate-800 bg-slate-900/40'}`}><SkipBack className="w-8 h-8 rotate-180" /></button>
               <button onClick={() => stepFrame(1)} className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 active:scale-95 transition-all" title="Next Frame (1/30s)">
                 <ChevronRight className="w-6 h-6" />
                 <span className="text-[6px] font-black block text-center -mt-1 uppercase">Frame</span>
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloStudio;
