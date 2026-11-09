import React, { useState } from 'react';
import { Cpu, Zap, CheckCircle2, AlertTriangle, Sliders, Database, ArrowRight, ShieldCheck, BookOpen, AlertOctagon } from 'lucide-react';
import { predictSample } from '../services/api';

export default function AIPrediction({ onNavigate }) {
  const [ph, setPh] = useState(7.2);
  const [solids, setSolids] = useState(480);
  const [turbidity, setTurbidity] = useState(1.2);
  const [hardness, setHardness] = useState(180);
  const [sulfate, setSulfate] = useState(160);
  const [chloramines, setChloramines] = useState(2.2);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await predictSample({
        ph: Number(ph),
        solids: Number(solids),
        turbidity: Number(turbidity),
        hardness: Number(hardness),
        sulfate: Number(sulfate),
        chloramines: Number(chloramines),
        conductivity: 320,
        organic_carbon: 2.5,
        trihalomethanes: 35
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const screening = result?.scientific_screening;
  const mlPred = result?.ml_prediction;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          AI Prediction & Scientific Screening Console
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Explore the clear separation between <strong>Scientific Parameter Screening (BIS IS 10500)</strong> and the <strong>Machine Learning Model Prediction</strong>. Adjust key parameters below to observe both systems concurrently.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Console */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Parameter Sensitivity Tuner (BIS IS 10500 Limits)
          </h3>

          {/* Slider 1: pH */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">pH Level:</span>
              <span className="font-mono text-cyan-400 font-bold">{ph} <span className="text-[10px] text-slate-400 font-normal">[BIS: 6.5 – 8.5]</span></span>
            </div>
            <input
              type="range"
              min="4.0"
              max="11.0"
              step="0.1"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>4.0 (Acidic - Exceeds)</span>
              <span>6.5 - 8.5 (Acceptable)</span>
              <span>11.0 (Alkaline - Exceeds)</span>
            </div>
          </div>

          {/* Slider 2: Solids (TDS) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Total Dissolved Solids / TDS (mg/L):</span>
              <span className="font-mono text-cyan-400 font-bold">{Number(solids).toLocaleString()} mg/L <span className="text-[10px] text-slate-400 font-normal">[BIS: 500 / 2000]</span></span>
            </div>
            <input
              type="range"
              min="100"
              max="3500"
              step="50"
              value={solids}
              onChange={(e) => setSolids(e.target.value)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>&lt; 500 (Acceptable)</span>
              <span>500 - 2000 (Permissible)</span>
              <span>&gt; 2000 (Exceeds Limit)</span>
            </div>
          </div>

          {/* Slider 3: Turbidity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Turbidity (NTU):</span>
              <span className="font-mono text-cyan-400 font-bold">{turbidity} NTU <span className="text-[10px] text-slate-400 font-normal">[BIS: 1.0 / 5.0]</span></span>
            </div>
            <input
              type="range"
              min="0.2"
              max="10.0"
              step="0.1"
              value={turbidity}
              onChange={(e) => setTurbidity(e.target.value)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>&le; 1.0 (Acceptable)</span>
              <span>1.0 - 5.0 (Permissible)</span>
              <span>&gt; 5.0 (Exceeds Limit)</span>
            </div>
          </div>

          {/* Slider 4: Hardness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Total Hardness (mg/L):</span>
              <span className="font-mono text-cyan-400 font-bold">{hardness} mg/L <span className="text-[10px] text-slate-400 font-normal">[BIS: 200 / 600]</span></span>
            </div>
            <input
              type="range"
              min="50"
              max="900"
              step="10"
              value={hardness}
              onChange={(e) => setHardness(e.target.value)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>&le; 200 (Acceptable)</span>
              <span>200 - 600 (Permissible)</span>
              <span>&gt; 600 (Exceeds Limit)</span>
            </div>
          </div>

          {/* Slider 5: Sulfate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Sulphate (mg/L):</span>
              <span className="font-mono text-cyan-400 font-bold">{sulfate} mg/L <span className="text-[10px] text-slate-400 font-normal">[BIS: 200 / 400]</span></span>
            </div>
            <input
              type="range"
              min="50"
              max="650"
              step="10"
              value={sulfate}
              onChange={(e) => setSulfate(e.target.value)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>&le; 200 (Acceptable)</span>
              <span>200 - 400 (Permissible)</span>
              <span>&gt; 400 (Exceeds Limit)</span>
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            {loading ? 'Evaluating Dual Systems...' : 'Execute Dual Assessment'}
          </button>
        </div>

        {/* Real-time Dual Outcomes Column */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Independent Assessment Outputs
            </h3>

            {result ? (
              <div className="space-y-4">
                {/* 1. Scientific Screening Outcome */}
                <div className={`p-4 rounded-xl border text-center ${
                  screening?.outcome_code === 'ACCEPTABLE' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
                  screening?.outcome_code === 'PERMISSIBLE_SOURCE' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
                  screening?.outcome_code === 'EXCEEDS_LIMIT' ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' :
                  'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System A: BIS IS 10500:2012
                  </div>
                  <div className="text-sm font-black mt-1">
                    {screening?.assessment_outcome}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {screening?.outcome_detail}
                  </p>
                </div>

                {/* 2. ML Prediction */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">System B: ML Classifier</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      mlPred?.is_potable ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {mlPred?.verdict}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between text-[11px]">
                      <span>Model Confidence:</span>
                      <span className="font-mono font-bold text-white">{(mlPred?.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Potability Probability:</span>
                      <span className="font-mono text-cyan-400">{(mlPred?.probability_potable * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 leading-tight">
                    * {mlPred?.limitations}
                  </p>
                </div>

                {/* Parameters outside limits */}
                {screening?.exceeded_parameters?.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
                    <strong className="block text-[11px]">Parameters Outside Limits:</strong>
                    {screening.exceeded_parameters.map((p, i) => (
                      <span key={i} className="inline-block bg-rose-500/20 px-2 py-0.5 rounded text-[10px] mr-1 mb-1 font-mono">
                        • {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Missing tests */}
                {screening?.missing_crucial_tests?.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                    <strong className="block text-[11px]">Missing Laboratory Tests:</strong>
                    {screening.missing_crucial_tests.map((t, i) => (
                      <div key={i} className="text-[10px] text-slate-300">• {t}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <Zap className="w-10 h-10 mx-auto text-cyan-400/50" />
                <p className="text-xs">
                  Tune any slider and press <strong className="text-cyan-400">Execute Dual Assessment</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigate('analyzer')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Open Complete Laboratory Audit Table <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
