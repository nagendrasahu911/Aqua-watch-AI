import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Search, Filter } from 'lucide-react';
import { evaluateAnomaly } from '../services/api';

export default function AnomalyDetection({ history }) {
  const [testSample, setTestSample] = useState({
    ph: 9.8,
    solids: 32000,
    chloramines: 8.5,
    sulfate: 450,
    conductivity: 620,
    organic_carbon: 14.5,
    trihalomethanes: 110,
    turbidity: 6.8
  });

  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const handleTestAnomaly = async () => {
    setLoading(true);
    try {
      const res = await evaluateAnomaly(testSample);
      setEvaluation(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const flaggedSamples = (history || []).filter(h => h.is_anomaly);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Water Safety & Environmental Anomaly Detection
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Identifies sensor drift, biochemical contamination, and regulatory violations against World Health Organization (WHO) and US EPA Safe Drinking Water guidelines.
        </p>
      </div>

      {/* Live Anomaly Rule Engine Tester */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              WHO & EPA Standard Compliance Scanner
            </h3>
            <p className="text-xs text-slate-400">
              Test synthetic or custom sensor vectors against safe permissible limits
            </p>
          </div>
          <button
            onClick={handleTestAnomaly}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            {loading ? 'Scanning Limits...' : 'Run Anomaly Scan'}
          </button>
        </div>

        {evaluation && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Scan Evaluation:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                evaluation.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                evaluation.risk_level === 'MODERATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {evaluation.risk_level} RISK
              </span>
            </div>

            {evaluation.violations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {evaluation.violations.map((viol, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{viol}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
                All parameters conform strictly to WHO standards.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Flagged Anomalies Table */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Flagged Anomalies in Stored Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Historical samples that breached safety standards ({flaggedSamples.length} total)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Sample ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Potability Verdict</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 rounded-r-lg">Standard Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {flaggedSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">#{sample.id}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(sample.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      sample.is_potable 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {sample.verdict}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {(sample.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-amber-300/90 max-w-md truncate">
                    {sample.anomaly_reasons || 'Threshold violation detected'}
                  </td>
                </tr>
              ))}
              {flaggedSamples.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No anomalies recorded yet.
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
