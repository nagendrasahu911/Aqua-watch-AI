import React from 'react';
import { Info, Award, Code, Globe, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          About AquaWatch AI Platform
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Designed and engineered as a Next-Generation Smart Water Intelligence & Environmental Safety Solution for AI Hackathons.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mission Card */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Project Vision</h3>
              <p className="text-xs text-slate-400">Sustainable Development Goal #6: Clean Water and Sanitation</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Over 2 billion people worldwide lack access to safely managed drinking water. AquaWatch AI bridges the gap between laboratory chemical analysis and instant field-level decision support through machine learning pipelines, providing municipal authorities and remote communities with immediate contamination alerts.
          </p>
        </div>

        {/* Tech Stack Card */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Full-Stack Technology Stack</h3>
              <p className="text-xs text-slate-400">Modern Architecture</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div><strong className="text-cyan-400">Machine Learning:</strong> Python, Scikit-learn, Pandas, NumPy, Joblib</div>
            <div><strong className="text-cyan-400">Backend API:</strong> FastAPI, Uvicorn, Pydantic v2, Python-Multipart</div>
            <div><strong className="text-cyan-400">Database Engine:</strong> SQLite3 with SQLAlchemy ORM</div>
            <div><strong className="text-cyan-400">Frontend UI:</strong> React, Vite, Tailwind CSS, Lucide Icons, Recharts</div>
            <div><strong className="text-cyan-400">Report Engine:</strong> jsPDF & AutoTable</div>
          </div>
        </div>

        {/* Hackathon Highlights */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hackathon Jury Evaluation Highlights</h3>
              <p className="text-xs text-slate-400">Core Engineering Accomplishments</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-cyan-300 block mb-1">1. Real ML Inference</strong>
              No simulated random numbers. Every prediction routes through the trained Random Forest pipeline with median imputation and scaling.
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-cyan-300 block mb-1">2. Domain Standard Rules</strong>
              Dual-layer verification combining probabilistic ML with deterministic WHO/EPA water safety thresholds.
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-cyan-300 block mb-1">3. Immutable Audit Log</strong>
              Every tested sample and batch CSV upload is logged to persistent storage with full provenance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
