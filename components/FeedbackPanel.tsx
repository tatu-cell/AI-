
import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircle2, MessageSquare, ArrowUpRight, X, Lightbulb, TrendingUp } from 'lucide-react';

interface FeedbackPanelProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ analysis, onClose }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 p-8 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-50 max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500 ease-out">
      <div className="max-w-4xl mx-auto relative">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-2 p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
            <Lightbulb className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Gemini AI Coaching Insight</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Session Analysis Complete</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent rounded-full" />
              <div className="flex items-start gap-4">
                <MessageSquare className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                <p className="text-slate-100 text-lg leading-relaxed font-medium tracking-tight">
                  "{analysis.feedback}"
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Key Action Items
              </h4>
              <div className="grid gap-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30 hover:border-emerald-500/30 transition-all group">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Metric Breakdown</h4>
            
            <div className="bg-slate-800/60 p-6 rounded-[2rem] border border-slate-700/50 shadow-inner space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Posture Stability</span>
                  <span className="text-xl font-black text-white">{analysis.postureScore}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: `${analysis.postureScore}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Release Accuracy</span>
                  <span className="text-xl font-black text-white">{analysis.trajectoryConsistency}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: `${analysis.trajectoryConsistency}%` }}
                  />
                </div>
              </div>
            </div>

            <button className="group w-full flex items-center justify-between px-8 py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-2xl active:scale-[0.98]">
              <span>View technical report</span>
              <div className="p-1 bg-slate-950 rounded-lg text-white group-hover:bg-blue-600 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPanel;
