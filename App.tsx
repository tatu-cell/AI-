
import React, { useState } from 'react';
import { Menu, History, BarChart2, CheckCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SoloStudio from './components/SoloStudio';
import CompareStudio from './components/CompareStudio';
import { AnalysisTab, AnalysisViewMode } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('solo_side');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-[50]">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-slate-800 rounded-xl active:scale-90 transition-all">
              <Menu className="w-6 h-6 text-slate-300" />
            </button>
            <div>
              <h1 className="text-sm font-black tracking-[0.2em] text-blue-400 uppercase">Boccia Vision PC</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{activeTab.replace('_', ' ')} Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Offline Workspace</span>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tight">Active Engine</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-slate-700 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">AI</span>
            </div>
          </div>
        </header>

        <div className="flex-1 relative bg-black overflow-hidden">
          {activeTab === 'solo_side' && <SoloStudio key="side" mode={AnalysisViewMode.SIDE} />}
          {activeTab === 'solo_rear' && <SoloStudio key="rear" mode={AnalysisViewMode.REAR} />}
          {activeTab === 'compare' && <CompareStudio />}

          {activeTab === 'history' && (
            <div className="h-full w-full overflow-y-auto p-8 flex flex-col items-center bg-slate-950">
               <div className="w-full max-w-2xl space-y-4 text-center mt-20">
                 <History className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                 <h2 className="text-xl font-black uppercase tracking-widest">Analysis Archives</h2>
                 <p className="text-xs text-slate-500">保存されたリサーチレコードをこちらで確認・JSON出力できます。</p>
               </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="h-full w-full flex items-center justify-center p-6 text-center bg-slate-950">
              <div className="max-w-sm">
                <BarChart2 className="w-16 h-16 text-slate-800 mx-auto mb-10" />
                <h2 className="text-2xl font-black mb-4 text-white uppercase tracking-tighter">Performance Library</h2>
                <p className="text-[11px] font-bold leading-relaxed text-slate-500 uppercase tracking-[0.2em]">統計データ。複数のレコードを解析して傾向を算出します。</p>
              </div>
            </div>
          )}
        </div>

        {showSaveToast && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Record Saved to Database</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
