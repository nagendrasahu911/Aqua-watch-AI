import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  TestTube,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { predictSample } from '../services/api';

const DEFAULT_SAMPLE = {
  // Physical & Basic Chemical (IS 10500 Core)
  ph: 7.2,
  solids: 450.0,      // TDS
  turbidity: 0.8,
  hardness: 180.0,
  sulfate: 140.0,
  chloramines: 2.1,
  conductivity: 320.0,
  organic_carbon: 2.5,
  trihalomethanes: 35.0,

  // Section 5: Extended Laboratory Parameters
  e_coli: '',
  total_coliform: '',
  arsenic: '',
  lead: '',
  fluoride: '',
  nitrate: '',
  iron: '',
  chloride: ''
};

const PRESETS = [
  {
    name: 'Standard Municipal Treated Tap (Within IS 10500 Acceptable)',
    data: { ph: 7.2, solids: 420.0, turbidity: 0.8, hardness: 160.0, sulfate: 120.0, chloramines: 2.0, conductivity: 310.0, organic_carbon: 1.8, trihalomethanes: 30.0, e_coli: 0, total_coliform: 0, arsenic: 0.005, lead: 0.002, fluoride: 0.7, nitrate: 18.0, iron: 0.1, chloride: 110.0 },
    note: 'Meets BIS Acceptable Limits across all tested parameters.'
  },
  {
    name: 'Mineral-Rich Borewell (Permissible Source - No Alternate)',
    data: { ph: 7.5, solids: 1100.0, turbidity: 2.2, hardness: 420.0, sulfate: 290.0, chloramines: 1.5, conductivity: 850.0, organic_carbon: 3.2, trihalomethanes: 15.0, e_coli: 0, total_coliform: 0, arsenic: 0.02, lead: 0.008, fluoride: 1.2, nitrate: 32.0, iron: 0.6, chloride: 450.0 },
    note: 'TDS & Hardness exceed acceptable limit, but within permissible range.'
  },
  {
    name: 'High Contaminant / Industrial Runoff (Exceeds Reference Limit)',
    data: { ph: 9.2, solids: 2800.0, turbidity: 6.8, hardness: 720.0, sulfate: 520.0, chloramines: 6.5, conductivity: 1200.0, organic_carbon: 14.0, trihalomethanes: 140.0, e_coli: 25, total_coliform: 80, arsenic: 0.08, lead: 0.04, fluoride: 2.4, nitrate: 75.0, iron: 2.5, chloride: 1200.0 },
    note: 'Multiple parameters exceed BIS IS 10500 permissible caps.'
  },
  {
    name: 'Kaggle Dataset Potable Sample #254 (ML Focus)',
    data: { ph: 7.17, solids: 20401.1, turbidity: 3.94, hardness: 203.4, sulfate: 287.1, chloramines: 7.68, conductivity: 315.5, organic_carbon: 14.53, trihalomethanes: 74.4 },
    note: 'True Kaggle Class 1 potable sample. (Demonstrates ML statistical pattern vs. BIS thresholds).'
  }
];

export default function WaterAnalyzer({ onSampleEvaluated }) {
  const [formData, setFormData] = useState(DEFAULT_SAMPLE);
  const [showLabSection, setShowLabSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };

  const handleApplyPreset = (presetData) => {
    setFormData({
      ...DEFAULT_SAMPLE,
      ...presetData
    });
    setResult(null);
    setError(null);
  };

  const handleReset = () => {
    setFormData({
      ph: '', solids: '', turbidity: '', hardness: '',
      sulfate: '', chloramines: '', conductivity: '', organic_carbon: '',
      trihalomethanes: '', e_coli: '', total_coliform: '', arsenic: '',
      lead: '', fluoride: '', nitrate: '', iron: '', chloride: ''
    });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {};
      Object.entries(formData).forEach(([k, v]) => {
        payload[k] = v === '' ? null : Number(v);
      });

      const res = await predictSample(payload);
      setResult(res);
      if (onSampleEvaluated) onSampleEvaluated();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to communicate with prediction server.');
    } finally {
      setLoading(false);
    }
  };

  const screening = result?.scientific_screening;
  const mlPred = result?.ml_prediction;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              Water Quality Assessment Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Dual-System Evaluation: <strong>Scientific Parameter Screening</strong> based on Bureau of Indian Standards (BIS IS 10500:2012) alongside a separate <strong>Machine Learning Prediction</strong>.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
            BIS IS 10500:2012 Standard
          </span>
        </div>

        {/* Presets */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Load Test Benchmarks:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p.data)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-cyan-500/10 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
              title={p.note}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Core Physical & Chemical Parameters (IS 10500)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* pH */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    pH Level (0.0 – 14.0)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 6.5 – 8.5]</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="14"
                    name="ph"
                    value={formData.ph}
                    onChange={handleChange}
                    placeholder="e.g. 7.20"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* TDS (Solids) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Dissolved Solids / TDS (mg/L)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 500 / 2000]</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="solids"
                    value={formData.solids}
                    onChange={handleChange}
                    placeholder="e.g. 450"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Turbidity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Turbidity (NTU)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 1.0 / 5.0]</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="turbidity"
                    value={formData.turbidity}
                    onChange={handleChange}
                    placeholder="e.g. 0.80"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Total Hardness */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Hardness as CaCO3 (mg/L)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 200 / 600]</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="hardness"
                    value={formData.hardness}
                    onChange={handleChange}
                    placeholder="e.g. 180.0"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Sulphate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sulphate as SO4 (mg/L)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 200 / 400]</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="sulfate"
                    value={formData.sulfate}
                    onChange={handleChange}
                    placeholder="e.g. 140.0"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Chloramines */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chloramines Disinfectant (mg/L)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[Max: 4.0]</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="chloramines"
                    value={formData.chloramines}
                    onChange={handleChange}
                    placeholder="e.g. 2.1"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Trihalomethanes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Trihalomethanes / THMs (μg/L)
                    <span className="text-cyan-400 ml-1 font-mono text-[11px]">[Max: 100 μg/L]</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="trihalomethanes"
                    value={formData.trihalomethanes}
                    onChange={handleChange}
                    placeholder="e.g. 35.0"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Conductivity (Informational) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Electrical Conductivity (μS/cm)
                    <span className="text-slate-400 ml-1 font-mono text-[11px]">[Informational]</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="conductivity"
                    value={formData.conductivity}
                    onChange={handleChange}
                    placeholder="e.g. 320.0"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Organic Carbon (Informational) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Organic Carbon / TOC (mg/L)
                    <span className="text-slate-400 ml-1 font-mono text-[11px]">[Informational]</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="organic_carbon"
                    value={formData.organic_carbon}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: Expandable Extended Laboratory Parameters */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLabSection(!showLabSection)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Extended Laboratory Testing Panel (Microbiology, Heavy Metals & Anions)
                </span>
                {showLabSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showLabSection && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enter certified laboratory test results if available. These values are evaluated against BIS IS 10500 toxic and microbiological thresholds. Leave blank if not tested.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* E. coli */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        E. coli (MPN/100 mL)
                        <span className="text-rose-400 ml-1 font-mono text-[11px]">[Must be 0]</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        name="e_coli"
                        value={formData.e_coli}
                        onChange={handleChange}
                        placeholder="0 (Absent)"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Total Coliform */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Total Coliform Bacteria (MPN/100 mL)
                        <span className="text-rose-400 ml-1 font-mono text-[11px]">[Must be 0]</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        name="total_coliform"
                        value={formData.total_coliform}
                        onChange={handleChange}
                        placeholder="0 (Absent)"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Arsenic */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Arsenic as As (mg/L)
                        <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 0.01 / 0.05]</span>
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        name="arsenic"
                        value={formData.arsenic}
                        onChange={handleChange}
                        placeholder="e.g. 0.005"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Lead */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Lead as Pb (mg/L)
                        <span className="text-rose-400 ml-1 font-mono text-[11px]">[BIS: 0.01 - No relaxation]</span>
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        name="lead"
                        value={formData.lead}
                        onChange={handleChange}
                        placeholder="e.g. 0.002"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Fluoride */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Fluoride as F (mg/L)
                        <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 1.0 / 1.5]</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="fluoride"
                        value={formData.fluoride}
                        onChange={handleChange}
                        placeholder="e.g. 0.8"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Nitrate */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nitrate as NO3 (mg/L)
                        <span className="text-rose-400 ml-1 font-mono text-[11px]">[BIS: 45.0 - No relaxation]</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        name="nitrate"
                        value={formData.nitrate}
                        onChange={handleChange}
                        placeholder="e.g. 20.0"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Iron */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Iron as Fe (mg/L)
                        <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 0.3 / 1.0]</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="iron"
                        value={formData.iron}
                        onChange={handleChange}
                        placeholder="e.g. 0.15"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Chloride */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Chloride as Cl (mg/L)
                        <span className="text-cyan-400 ml-1 font-mono text-[11px]">[BIS: 250 / 1000]</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        name="chloride"
                        value={formData.chloride}
                        onChange={handleChange}
                        placeholder="e.g. 120"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Executing Scientific & ML Screening...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    Evaluate Water Quality
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Output Box: Dual-Engine Outcomes */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Dual Assessment Outcomes</h3>
            <p className="text-xs text-slate-400">Scientific Screening & ML Prediction</p>

            {result ? (
              <div className="mt-4 space-y-4">
                {/* 1. Scientific Screening Outcome Box */}
                <div className={`p-4 rounded-2xl border text-center ${
                  screening?.outcome_code === 'ACCEPTABLE' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
                  screening?.outcome_code === 'PERMISSIBLE_SOURCE' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
                  screening?.outcome_code === 'EXCEEDS_LIMIT' ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' :
                  'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System A: BIS IS 10500:2012 Screening
                  </div>
                  <div className="text-base font-black mt-1 leading-snug">
                    {screening?.assessment_outcome}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    {screening?.outcome_detail}
                  </p>
                </div>

                {/* 2. Separate Machine Learning Prediction Box */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      System B: Machine Learning
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      mlPred?.is_potable ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {mlPred?.verdict}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between text-[11px]">
                      <span>Model Confidence:</span>
                      <span className="font-mono font-bold text-white">{(mlPred?.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Class 1 (Potable) Probability:</span>
                      <span className="font-mono text-cyan-400 font-bold">{(mlPred?.probability_potable * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Class 0 (Unsafe) Probability:</span>
                      <span className="font-mono text-rose-400 font-bold">{(mlPred?.probability_not_potable * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 leading-tight">
                    * {mlPred?.limitations}
                  </p>
                </div>

                {/* Missing crucial tests recommendation */}
                {screening?.missing_crucial_tests?.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Unperformed Critical Tests:
                    </div>
                    {screening.missing_crucial_tests.map((t, idx) => (
                      <div key={idx} className="text-slate-300">• {t}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">
                  Enter water parameters or select a benchmark above, then click <strong className="text-cyan-400">Evaluate Water Quality</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
            <strong>Standards Reference:</strong> BIS IS 10500:2012 Drinking Water Specification. Never certifies safety without microbiological tests.
          </div>
        </div>
      </div>

      {/* SECTION 3: Parameter-Wise Result Table */}
      {result && screening?.parameter_results && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                BIS IS 10500:2012 Parameter-Wise Compliance Audit
              </h3>
              <p className="text-xs text-slate-400">
                Detailed comparison of each tested measurement against official Acceptable and Permissible limits.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
              {screening.tested_parameters_count} Parameters Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 rounded-l-lg">Parameter Name</th>
                  <th className="py-3 px-3">Measured Value</th>
                  <th className="py-3 px-3">Acceptable Limit</th>
                  <th className="py-3 px-3">Permissible Limit (No Alt Source)</th>
                  <th className="py-3 px-3">Compliance Status</th>
                  <th className="py-3 px-3 rounded-r-lg">Scientific Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {screening.parameter_results.map((row) => {
                  const isExceed = row.status_code === 'EXCEEDS';
                  const isPerm = row.status_code === 'PERMISSIBLE';
                  const isAccept = row.status_code === 'ACCEPTABLE';
                  const isNotTested = row.status_code === 'NOT_TESTED';

                  return (
                    <tr 
                      key={row.key} 
                      className={`transition-colors ${
                        isExceed ? 'bg-rose-500/10 hover:bg-rose-500/15' :
                        isPerm ? 'bg-amber-500/5 hover:bg-amber-500/10' :
                        'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-white">
                        {row.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{row.category}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {row.measured_value !== null ? `${row.measured_value} ${row.unit}` : <span className="text-slate-500 font-normal">Not Tested</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{row.acceptable_limit}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{row.permissible_limit}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAccept ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isPerm ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          isExceed ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-300 max-w-sm">
                        {row.explanation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
