import React, { useState } from 'react';
import { Database, UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { uploadCsv } from '../services/api';

export default function DatasetExplorer({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const res = await uploadCsv(file);
      setUploadResult(res);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload and process CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity\n" +
      "7.12,190.5,16200.0,5.8,312.0,410.0,11.5,58.0,3.1\n" +
      "8.40,245.0,22500.0,8.2,390.0,495.0,17.5,82.0,4.8\n" +
      "6.85,175.0,13800.0,4.2,280.0,380.0,9.2,42.0,2.5\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "aquawatch_batch_telemetry_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          Dataset Explorer & Batch CSV Telemetry Ingestion
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Upload multi-row CSV telemetry datasets to execute batch machine learning inference, evaluate potability distributions, and synchronize new samples into SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CSV Ingestion Box */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Batch File Upload
            </h3>
            <button
              onClick={downloadSampleTemplate}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Download CSV Template
            </button>
          </div>

          <div className="border-2 border-dashed border-cyan-500/30 rounded-2xl p-8 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              id="csv-file-input"
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer space-y-3 block">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="text-sm font-semibold text-white">
                {file ? file.name : 'Click to select CSV telemetry dataset'}
              </div>
              <p className="text-xs text-slate-400">
                Supports standard Water Potability feature columns (ph, hardness, solids, etc.)
              </p>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {uploadResult.message}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-slate-200">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  Total Processed: <strong>{uploadResult.processed_samples}</strong>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-emerald-400">
                  Potable: <strong>{uploadResult.potable_samples}</strong>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-rose-400">
                  Unsafe: <strong>{uploadResult.non_potable_samples}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Processing Batch Inference...
              </>
            ) : (
              'Upload and Run Batch ML Inference'
            )}
          </button>
        </div>

        {/* Dataset Reference Specs */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
            Kaggle Reference Specification
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            AquaWatch AI is trained on the <strong className="text-white">Water Potability</strong> dataset (Aditya Kadiwal, Kaggle) comprising 3,276 real-world water bodies.
          </p>

          <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
            <div><strong>Total Attributes:</strong> 9 features + 1 target</div>
            <div><strong>Target Class:</strong> Potability (0 or 1)</div>
            <div><strong>Missing Value Strategy:</strong> Median Imputer</div>
            <div><strong>Scaling Strategy:</strong> Standard Scaler ($z = (x - \mu)/\sigma$)</div>
            <div><strong>Algorithm:</strong> Balanced Random Forest (200 Trees)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
