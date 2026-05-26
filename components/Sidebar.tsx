
import React from 'react';
import { History, BarChart2, X, Video, User, MoveHorizontal } from 'lucide-react';
import { AnalysisTab } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onTabChange, onClose }) => {
  const menuItems = [
    { id: 'solo_side', icon: MoveHorizontal, label: 'サイド解析 (MP4)', color: 'text-blue-400' },
    { id: 'solo_rear', icon: User, label: '背面解析 (MP4)', color: 'text-indigo-400' },
    { id: 'compare', icon: Video, label: '比較スタジオ', color: 'text-purple-400' },
    { id: 'history', icon: History, label: '解析アーカイブ', color: 'text-slate-400' },
    { id: 'stats', icon: BarChart2, label: 'パフォーマンス統計', color: 'text-emerald-400' },
  ] as const;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed inset-y-0 left-0 w-80 bg-slate-900 border-r border-slate-800 z-[70] transform transition-transform duration-500
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="font-black text-sm text-white">BV</span>
            </div>
            <span className="font-black tracking-tighter text-lg">Boccia Vision PC</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 py-8 overflow-y-auto flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">Main Menu</p>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as AnalysisTab)}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all
                  ${activeTab === item.id 
                    ? 'bg-slate-800 border border-slate-700 shadow-xl' 
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? item.color : 'text-slate-500'}`} />
                  <span className={`text-sm font-bold ${activeTab === item.id ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8 border-t border-slate-800/50">
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <p className="text-[10px] text-slate-600 font-bold">Vision Core v3.0 PC-Stable</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
