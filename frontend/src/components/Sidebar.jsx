import React from 'react';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Cpu, 
  AlertTriangle, 
  BarChart3, 
  MapPin, 
  History, 
  Sparkles, 
  FileText, 
  Database, 
  Settings, 
  Info,
  Droplets,
  ChevronRight,
  Radio,
  X
} from 'lucide-react';

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
  { id: 'iot', label: 'ESP32 IoT Hardware', icon: Radio, badge: 'Hardware' },
  { id: 'analyzer', label: 'Water Analyzer', icon: FlaskConical },
  { id: 'prediction', label: 'AI Prediction', icon: Cpu },
  { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'locations', label: 'Monitoring Map', icon: MapPin },
  { id: 'history', label: 'Historical Records', icon: History },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'dataset', label: 'Dataset Explorer', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 glass-panel border-r border-cyan-500/20 
        transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-cyan-500/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent tracking-wide">
                AquaWatch AI
              </h1>
              <p className="text-xs text-cyan-400/80 font-medium tracking-wider uppercase">
                Water Intelligence
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Intelligence Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/30 shadow-md shadow-cyan-950' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-slate-700 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Status */}
        <div className="p-4 border-t border-cyan-500/15 m-3 rounded-2xl bg-slate-900/60 border">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400">Random Forest Online</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            FastAPI + Scikit-Learn Engine
          </p>
        </div>
      </aside>
    </>
  );
}
