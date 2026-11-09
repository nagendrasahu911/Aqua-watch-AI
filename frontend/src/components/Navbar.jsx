import React from 'react';
import { Menu, Activity, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenSidebar, currentTitle, onRefresh, isRefreshing, healthStatus }) {
  return (
    <header className="h-20 glass-panel border-b border-cyan-500/15 sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {currentTitle}
          </h2>
          <p className="text-xs text-cyan-400/90 hidden sm:block">
            AquaWatch AI • Real-Time Environmental Telemetry & Potability Decision Support
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Sync Backend</span>
        </button>

        {/* Backend status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs">
          <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'healthy' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-slate-300 font-medium hidden sm:inline">API:</span>
          <span className="text-emerald-400 font-semibold">{healthStatus?.status === 'healthy' ? 'Connected' : 'Connecting...'}</span>
        </div>

        {/* User / Demo pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            AI
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-semibold text-white">Hackathon Jury</div>
            <div className="text-[10px] text-cyan-400 font-mono">Judge Session #1</div>
          </div>
        </div>
      </div>
    </header>
  );
}
