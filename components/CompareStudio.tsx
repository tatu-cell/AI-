
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Columns, Layers, RefreshCw, Anchor, Zap, ChevronLeft, ChevronRight, RotateCcw, Maximize, ZoomIn, ZoomOut, Target } from 'lucide-react';

const CompareStudio: React.FC = () => {
  const [videoA, setVideoA] = useState<string | null>(null);
  const [videoB, setVideoB] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layout, setLayout] = useState<'split' | 'overlay'>('split');
  const [opacity, setOpacity] = useState(0.5);
  const [syncOffset, setSyncOffset] = useState(0);
  const [markA, setMarkA] = useState<number | null>(null);
  const [markB, setMarkB] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vA = videoRefA.current;
    if (!vA) return;
    const handleTimeUpdate = () => {
      setCurrentTime(vA.currentTime);
      if (videoRefB.current && isPlaying) {
        const targetB = vA.currentTime + syncOffset;
        if (Math.abs(videoRefB.current.currentTime - targetB) > 0.03) {
          videoRefB.current.currentTime = Math.max(0, Math.min(videoRefB.current.duration, targetB));
        }
      }
    };
    vA.addEventListener('timeupdate', handleTimeUpdate);
    vA.addEventListener('loadedmetadata', () => setDuration(vA.duration));
    return () => vA.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlaying, syncOffset]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (target === 'A') setVideoA(url);
      else setVideoB(url);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      videoRefA.current?.pause(); 
      videoRefB.current?.pause();
    } else {
      if (videoRefB.current && videoRefA.current) {
        videoRefB.current.currentTime = videoRefA.current.currentTime + syncOffset;
      }
      videoRefA.current?.play(); 
      videoRefB.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const autoSync = () => {
    if (markA !== null && markB !== null) {
      const offset = markB - markA;
      setSyncOffset(offset);
      if (videoRefA.current) videoRefA.current.currentTime = markA;
      if (videoRefB.current) videoRefB.current.currentTime = markB;
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Absolute Viewport Mapping */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-200" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
          {/* Video A: Always Base Layer */}
          <div className={`absolute transition-all duration-300 ${layout === 'split' ? 'top-0 left-0 w-full h-1/2 border-b border-slate-800' : 'inset-0'}`}>
            {videoA ? (
              <video ref={videoRefA} src={videoA} className="w-full h-full object-contain" muted loop playsInline />
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-900">
                <Upload className="w-8 h-8 mb-2 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Load Master A</span>
                <input type="file" className="hidden" accept="video/*" onChange={e => handleFileUpload(e, 'A')} />
              </label>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 rounded text-[8px] font-black z-30 uppercase">Master A</div>
          </div>

          {/* Video B: Overlaid Layer */}
          <div 
            className={`absolute transition-all duration-300 ${layout === 'split' ? 'bottom-0 left-0 w-full h-1/2' : 'inset-0'}`}
            style={{ opacity: layout === 'overlay' ? opacity : 1 }}
          >
            {videoB ? (
              <video ref={videoRefB} src={videoB} className="w-full h-full object-contain" muted loop playsInline />
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-900">
                <Upload className="w-8 h-8 mb-2 text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Load Compare B</span>
                <input type="file" className="hidden" accept="video/*" onChange={e => handleFileUpload(e, 'B')} />
              </label>
            )}
            <div className={`absolute px-2 py-0.5 bg-purple-600 rounded text-[8px] font-black z-30 uppercase ${layout === 'split' ? 'top-2 right-2' : 'bottom-2 right-2'}`}>Compare B</div>
          </div>
        </div>

        {/* View Controls Overlay */}
        <div className="absolute top-4 left-0 right-0 z-[60] flex justify-center items-center gap-2">
          <div className="flex bg-slate-900/90 backdrop-blur-xl rounded-xl p-1 border border-slate-700 shadow-2xl">
            <button onClick={() => setLayout('split')} className={`p-2 rounded-lg ${layout === 'split' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><Columns className="w-4 h-4" /></button>
            <button onClick={() => setLayout('overlay')} className={`p-2 rounded-lg ${layout === 'overlay' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}><Layers className="w-4 h-4" /></button>
          </div>
          <div className="flex bg-slate-900/90 backdrop-blur-xl rounded-xl p-1 border border-slate-700 shadow-2xl">
            <button onClick={() => setZoom(prev => Math.min(3, prev + 0.5))} className="p-2 text-slate-400"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1)} className="p-2 text-slate-400"><Maximize className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Ghost Opacity (Vertical) */}
        {layout === 'overlay' && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-2">
            <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="h-40 accent-purple-500 appearance-none bg-slate-800 rounded-full w-1.5" style={{ writingMode: 'bt-lr' } as any} />
            <span className="text-[8px] font-mono font-black text-purple-400">GHOST</span>
          </div>
        )}
      </div>

      {/* Control Console */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 pb-8 space-y-3 z-50">
        <div className="max-w-md mx-auto space-y-3">
          
          <div className="flex items-center gap-2">
            <button onClick={() => setMarkA(videoRefA.current?.currentTime || null)} className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase flex flex-col items-center ${markA !== null ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
              Mark A <span className="text-[7px] opacity-60 font-mono">{markA?.toFixed(2) || '--'}</span>
            </button>
            <button onClick={autoSync} disabled={markA === null || markB === null} className={`px-4 py-2.5 rounded-xl shadow-lg transition-all ${markA !== null && markB !== null ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-700'}`}><Zap className="w-4 h-4" /></button>
            <button onClick={() => setMarkB(videoRefB.current?.currentTime || null)} className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase flex flex-col items-center ${markB !== null ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
              Mark B <span className="text-[7px] opacity-60 font-mono">{markB?.toFixed(2) || '--'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
             <span className="text-[8px] font-black text-slate-500 uppercase">Shift</span>
             <input type="range" min="-10" max="10" step="0.001" value={syncOffset} onChange={e => setSyncOffset(parseFloat(e.target.value))} className="flex-1 h-1 accent-orange-600 appearance-none bg-slate-800 rounded-full" />
             <span className="text-[9px] font-mono text-orange-500 min-w-[40px] text-right">{syncOffset.toFixed(2)}s</span>
          </div>

          <div className="px-1 relative h-4 flex items-center">
             <input type="range" min="0" max={duration || 1} step="0.001" value={currentTime} onChange={e => {if(videoRefA.current) videoRefA.current.currentTime = parseFloat(e.target.value)}} className="w-full h-1 bg-slate-950 rounded-full accent-blue-600 appearance-none relative z-10" />
             {markA !== null && <div className="absolute w-0.5 h-full bg-blue-500 top-0 shadow-[0_0_8px_blue]" style={{ left: `${(markA / duration) * 100}%` }} />}
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={() => { if(videoRefA.current) videoRefA.current.currentTime = markA || 0; }} className="p-2 text-slate-600 active:text-orange-500"><Anchor className="w-6 h-6" /></button>
            <button onClick={() => { if(videoRefA.current) videoRefA.current.currentTime -= 0.033; }} className="p-1 text-slate-700"><ChevronLeft className="w-10 h-10" /></button>
            <button onClick={togglePlay} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl border-b-2 ${isPlaying ? 'bg-slate-200 text-slate-900' : 'bg-blue-600 text-white'}`}>{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}</button>
            <button onClick={() => { if(videoRefA.current) videoRefA.current.currentTime += 0.033; }} className="p-1 text-slate-700"><ChevronRight className="w-10 h-10" /></button>
            <button onClick={() => { setMarkA(null); setMarkB(null); setSyncOffset(0); }} className="p-2 text-slate-800"><RotateCcw className="w-6 h-6" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareStudio;
