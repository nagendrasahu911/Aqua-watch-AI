import React from 'react';
import { 
  Droplets, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  FlaskConical,
  Database
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

export default function Dashboard({ stats, history, onNavigate }) {
  const total = stats?.total_samples || 0;
  const potableCount = stats?.potable_count || 0;
  const nonPotableCount = stats?.non_potable_count || 0;
  const potablePct = stats?.potable_percentage || 0;
  const anomalyCount = stats?.anomaly_count || 0;
  const anomalyPct = stats?.anomaly_percentage || 0;

  // Pie chart data
  const pieData = [
    { name: 'Potable (Safe)', value: potableCount, color: '#06b6d4' },
    { name: 'Unsafe / Non-Potable', value: nonPotableCount, color: '#f43f5e' }
  ];

  // Trend data from recent history
  const trendData = [...(history || [])].reverse().slice(-10).map((h, idx) => ({
    name: `#${h.id}`,
    ph: h.ph || 7.0,
    solids: h.solids ? h.solids / 1000 : 15,
    turbidity: h.turbidity || 3.0,
    potability: h.potability
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-cyan-500/25">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-6 opacity-10 hidden md:block pointer-events-none">
          <Droplets className="w-48 h-48 text-cyan-400" />
        </div>
        <div className="max-w-2xl relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Telemetry Status: Live
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Smart Water Quality Intelligence Platform
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            AquaWatch AI processes multi-parameter chemical telemetry to classify water potability, predict contamination risks, and enforce WHO/EPA water safety compliance through Machine Learning.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('analyzer')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Analyze New Sample
            </button>
            <button
              onClick={() => onNavigate('dataset')}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-semibold text-xs tracking-wider transition-all cursor-pointer"
            >
              Upload Batch Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Samples */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Analyzed</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{total.toLocaleString()}</div>
            <div className="text-xs text-cyan-300/80 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-time SQLite database sync</span>
            </div>
          </div>
        </div>

        {/* Card 2: Potable Ratio */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Potable Water</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{potablePct}%</div>
            <div className="text-xs text-emerald-400/90 mt-1">
              {potableCount} safe drinking water samples
            </div>
          </div>
        </div>

        {/* Card 3: Detected Anomalies */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Anomalies & Contaminants</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{anomalyCount}</div>
            <div className="text-xs text-rose-400/90 mt-1">
              {anomalyPct}% breached safety thresholds
            </div>
          </div>
        </div>

        {/* Card 4: Average pH */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average pH Level</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{stats?.average_ph ? stats.average_ph : '7.08'}</div>
            <div className="text-xs text-sky-300/80 mt-1">
              WHO Permissible: 6.5 - 8.5 pH
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Trend Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Chemical Parameter Telemetry Trends
              </h3>
              <p className="text-xs text-slate-400">Recent sample pH and turbidity measurements</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> pH
              </span>
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Turbidity
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.length > 0 ? trendData : [{name: 'Empty', ph: 7, turbidity: 3}]}>
                <defs>
                  <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 14]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#06b6d4', 
                    borderRadius: '12px',
                    fontSize: '12px' 
                  }} 
                />
                <Area type="monotone" dataKey="ph" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#phGrad)" name="pH" />
                <Area type="monotone" dataKey="turbidity" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#turbGrad)" name="Turbidity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratio Donut Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              Potability Distribution
            </h3>
            <p className="text-xs text-slate-400">Class balance in recorded history</p>
          </div>

          <div className="h-48 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#06b6d4', 
                    borderRadius: '12px',
                    fontSize: '12px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Potable Samples
              </span>
              <span className="font-bold text-cyan-400">{potableCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Unsafe Samples
              </span>
              <span className="font-bold text-rose-400">{nonPotableCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Records Quick Snapshot */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Latest Tested Samples</h3>
            <p className="text-xs text-slate-400">Real records evaluated through Random Forest</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            View Full History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Sample ID</th>
                <th className="py-2.5 px-3">pH</th>
                <th className="py-2.5 px-3">Hardness</th>
                <th className="py-2.5 px-3">Solids (ppm)</th>
                <th className="py-2.5 px-3">Chloramines</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 rounded-r-lg">Anomaly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {(history || []).slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">#{row.id}</td>
                  <td className="py-2.5 px-3">{row.ph !== null ? row.ph.toFixed(2) : '—'}</td>
                  <td className="py-2.5 px-3">{row.hardness !== null ? row.hardness.toFixed(1) : '—'}</td>
                  <td className="py-2.5 px-3">{row.solids !== null ? row.solids.toFixed(0) : '—'}</td>
                  <td className="py-2.5 px-3">{row.chloramines !== null ? row.chloramines.toFixed(2) : '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      row.is_potable 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {row.is_potable ? 'Potable' : 'Unsafe'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {(row.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">
                    {row.is_anomaly ? (
                      <span className="text-amber-400 font-semibold">Flagged</span>
                    ) : (
                      <span className="text-slate-500">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No sample records found. Run a prediction to populate telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
