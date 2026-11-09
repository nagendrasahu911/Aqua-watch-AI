import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Bell, Shield, Database, CheckCircle2 } from 'lucide-react';

export default function Settings({ healthStatus, onRefresh }) {
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8000');
  const [notifications, setNotifications] = useState(true);
  const [anomalyThreshold, setAnomalyThreshold] = useState('WHO_STRICT');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          Platform Configuration & Parameters
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Adjust telemetry endpoints, environmental threshold strictness, and system integration options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Backend URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                FastAPI Backend Endpoint URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            {/* Regulatory Strictness */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Regulatory Anomaly Baseline
              </label>
              <select
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              >
                <option value="WHO_STRICT">World Health Organization (WHO) Drinking Guidelines (Strict)</option>
                <option value="EPA_STANDARD">US EPA Safe Drinking Water Standards (Default)</option>
                <option value="EU_DIRECTIVE">EU Drinking Water Directive 2020/2184</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-300">
                  Enable critical contamination alerts when water is flagged unsafe
                </span>
              </label>
            </div>

            {saved && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Settings successfully updated!</span>
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </form>
        </div>

        {/* System Diagnostics */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
            System Diagnostics
          </h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span>Service Health:</span>
              <span className="text-emerald-400 font-bold">{healthStatus?.status || 'Active'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span>Inference Engine:</span>
              <span className="text-cyan-400 font-bold">{healthStatus?.model_loaded || 'Random Forest'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span>Database Provider:</span>
              <span className="text-slate-200 font-mono">SQLite (Threadsafe)</span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Connection Now
          </button>
        </div>
      </div>
    </div>
  );
}
