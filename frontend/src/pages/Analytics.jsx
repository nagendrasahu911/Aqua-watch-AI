import React from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

export default function Analytics({ history, stats }) {
  // Aggregate data for parameter distributions
  const radarData = [
    { subject: 'pH Balance', A: stats?.average_ph ? (stats.average_ph / 14) * 100 : 50, fullMark: 100 },
    { subject: 'Turbidity (Clarity)', A: stats?.average_turbidity ? (stats.average_turbidity / 10) * 100 : 40, fullMark: 100 },
    { subject: 'Mineral Solids', A: stats?.average_solids ? Math.min((stats.average_solids / 35000) * 100, 100) : 60, fullMark: 100 },
    { subject: 'Safety Potability', A: stats?.potable_percentage || 50, fullMark: 100 },
    { subject: 'Compliance Index', A: stats?.anomaly_percentage ? (100 - stats.anomaly_percentage) : 80, fullMark: 100 }
  ];

  // Correlation scatter data (pH vs Chloramines)
  const scatterData = (history || []).map((h) => ({
    x: h.ph || 7.0,
    y: h.chloramines || 5.0,
    z: h.is_potable ? 1 : 0
  }));

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Advanced Water Analytics & Feature Correlation
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Explore multivariable correlations, distributions, and compliance indices derived from real stored water telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Metric Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Water Quality Multi-Axis Radar</h3>
            <p className="text-xs text-slate-400">Normalized performance against drinking standards</p>
          </div>

          <div className="h-72 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
                <Radar name="Quality Score" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
            <span>Overall Water Safety Score</span>
            <span className="font-bold text-cyan-400">{stats?.potable_percentage || 0}% Safe</span>
          </div>
        </div>

        {/* Scatter Plot: pH vs Chloramines */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Correlation: pH vs Chloramines Disinfectant</h3>
            <p className="text-xs text-slate-400">Distribution cluster across historical evaluations</p>
          </div>

          <div className="h-72 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis type="number" dataKey="x" name="pH" domain={[0, 14]} stroke="#64748b" label={{ value: 'pH Level', position: 'bottom', fill: '#64748b', fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Chloramines" domain={[0, 15]} stroke="#64748b" label={{ value: 'Chloramines (ppm)', angle: -90, position: 'left', fill: '#64748b', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#06b6d4', borderRadius: '12px' }} />
                <Scatter name="Samples" data={scatterData} fill="#38bdf8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
            <span>WHO Limit: Chloramines &lt; 4.0 ppm</span>
            <span className="text-slate-400">Total Points: {scatterData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
