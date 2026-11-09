import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Search,
  CheckSquare,
  Square,
  Layers,
  Filter,
  Info,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  downloadAllReportsPdf,
  downloadSingleReportPdf,
  downloadSelectedReportsPdf,
  triggerBlobDownload
} from '../services/api';

export default function Reports({ stats, history }) {
  // Loading states
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Single sample mode states
  const [selectedSingleId, setSelectedSingleId] = useState(
    history && history.length > 0 ? history[0].id : ''
  );
  const [singleSearchQuery, setSingleSearchQuery] = useState('');

  // Multiple sample selection states
  const [multiSearchQuery, setMultiSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filtered samples for single sample selector
  const availableSamples = useMemo(() => history || [], [history]);

  const filteredSingleOptions = useMemo(() => {
    if (!singleSearchQuery.trim()) return availableSamples;
    const q = singleSearchQuery.toLowerCase();
    return availableSamples.filter(
      (s) =>
        s.id.toString().includes(q) ||
        (s.source && s.source.toLowerCase().includes(q)) ||
        (s.verdict && s.verdict.toLowerCase().includes(q))
    );
  }, [availableSamples, singleSearchQuery]);

  // Active single sample data object
  const activeSingleSample = useMemo(() => {
    if (!selectedSingleId) return null;
    return availableSamples.find((s) => s.id === Number(selectedSingleId)) || null;
  }, [availableSamples, selectedSingleId]);

  // Filtered samples for multiple selection list
  const filteredMultiSamples = useMemo(() => {
    if (!multiSearchQuery.trim()) return availableSamples;
    const q = multiSearchQuery.toLowerCase();
    return availableSamples.filter(
      (s) =>
        s.id.toString().includes(q) ||
        (s.source && s.source.toLowerCase().includes(q)) ||
        (s.verdict && s.verdict.toLowerCase().includes(q))
    );
  }, [availableSamples, multiSearchQuery]);

  // Toggle single item selection in multiple list
  const toggleSelectId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all currently visible in multiple list
  const handleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredMultiSamples.forEach((s) => next.add(s.id));
      return next;
    });
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Handler A: Download All Samples Report
  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const blob = await downloadAllReportsPdf();
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(blob, `AquaWatch_Master_Report_All_Samples_${dateStr}.pdf`);
      setSuccessMessage('Master report containing all water samples downloaded successfully.');
    } catch (err) {
      console.error('Download All Error:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to generate all samples PDF report.');
    } finally {
      setDownloadingAll(false);
    }
  };

  // Handler B: Download Single Sample Report
  const handleDownloadSingle = async () => {
    if (!selectedSingleId) {
      setErrorMessage('Please select a water sample ID first.');
      return;
    }
    setDownloadingSingle(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const blob = await downloadSingleReportPdf(Number(selectedSingleId));
      triggerBlobDownload(blob, `AquaWatch_Sample_Report_ID${selectedSingleId}.pdf`);
      setSuccessMessage(`Official compliance report for Sample #${selectedSingleId} downloaded successfully.`);
    } catch (err) {
      console.error('Download Single Error:', err);
      setErrorMessage(err.response?.data?.detail || `Failed to generate PDF for Sample #${selectedSingleId}.`);
    } finally {
      setDownloadingSingle(false);
    }
  };

  // Handler C: Download Selected Samples Report
  const handleDownloadSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setErrorMessage('Please select at least one sample from the list.');
      return;
    }
    setDownloadingSelected(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const blob = await downloadSelectedReportsPdf(ids);
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(blob, `AquaWatch_Batch_Report_${ids.length}_Samples_${dateStr}.pdf`);
      setSuccessMessage(`Custom batch report with ${ids.length} selected samples downloaded successfully.`);
    } catch (err) {
      console.error('Download Selected Error:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to generate custom batch PDF report.');
    } finally {
      setDownloadingSelected(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Water Quality Compliance & Audit Reports
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Generate and download certified PDF audit reports with BIS IS 10500:2012 compliance verification, Random Forest inference, and anomaly analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Total Database: <strong className="text-white">{stats?.total_samples || availableSamples.length}</strong>
            </span>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 font-bold ml-4 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 font-bold ml-4 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Mode A: All Samples Report Card */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Mode A</span>
              <h3 className="text-lg font-bold text-white">All Samples Master Audit Report</h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Comprehensive Database Audit
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Exports a comprehensive master audit PDF encompassing all water quality records currently archived in the SQLite database.
          Includes aggregate telemetry KPIs, WHO &amp; BIS compliance distributions, and an immutable tabular batch ledger.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Total Archival Records</div>
            <div className="text-lg font-bold text-white mt-1">
              {stats?.total_samples || availableSamples.length} <span className="text-xs text-slate-400 font-normal">samples</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Safe Potability Ratio</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {stats?.potable_percentage || 0}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Unsafe Samples</div>
            <div className="text-lg font-bold text-red-400 mt-1">
              {stats?.non_potable_count || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Anomalous Outliers</div>
            <div className="text-lg font-bold text-amber-400 mt-1">
              {stats?.anomaly_count || 0}
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll || availableSamples.length === 0}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling Master PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download All Samples PDF Report ({stats?.total_samples || availableSamples.length} Records)
            </>
          )}
        </button>
      </div>

      {/* Grid for Mode B (Single) and Mode C (Multiple Selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mode B: Single Sample Report */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Mode B</span>
                  <h3 className="text-lg font-bold text-white">Download Specific Sample Report</h3>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Single Sample
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Inspect and export an individual water sample record. Generates an in-depth regulatory breakdown comparing all tested parameters against BIS IS 10500:2012 acceptable &amp; permissible limits.
            </p>

            {/* Searchable Sample Selector */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Target Sample ID:</span>
                {filteredSingleOptions.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    {filteredSingleOptions.length} available
                  </span>
                )}
              </label>

              <div className="relative">
                <select
                  value={selectedSingleId}
                  onChange={(e) => setSelectedSingleId(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="" disabled>-- Select a Sample ID --</option>
                  {filteredSingleOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sample #{s.id} • {new Date(s.created_at).toLocaleDateString()} • {s.is_potable ? 'POTABLE' : 'UNSAFE'} • pH {s.ph ? s.ph.toFixed(2) : '—'} • {s.source || 'Manual'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Sample Summary Card */}
            {activeSingleSample ? (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 text-xs mb-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Sample #{activeSingleSample.id}</span>
                    <span className="text-[11px] text-slate-400">
                      ({new Date(activeSingleSample.created_at).toLocaleString()})
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeSingleSample.is_potable
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {activeSingleSample.is_potable ? 'POTABLE' : 'NOT POTABLE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Source / Station</span>
                    <span className="text-white font-medium capitalize">{activeSingleSample.source || 'Standard Sensor'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ML Confidence</span>
                    <span className="text-cyan-400 font-medium">{(activeSingleSample.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Anomaly Status</span>
                    <span className={activeSingleSample.is_anomaly ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                      {activeSingleSample.is_anomaly ? 'Flagged Outlier' : 'Normal Profile'}
                    </span>
                  </div>
                </div>

                {/* Quick Parameters Snapshot */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div className="flex justify-between bg-slate-950/50 px-2 py-1 rounded">
                    <span className="text-slate-400">pH:</span>
                    <span className="text-cyan-300">{activeSingleSample.ph ? activeSingleSample.ph.toFixed(2) : '—'}</span>
                  </div>
                  <div className="flex justify-between bg-slate-950/50 px-2 py-1 rounded">
                    <span className="text-slate-400">TDS:</span>
                    <span className="text-cyan-300">{activeSingleSample.solids ? activeSingleSample.solids.toFixed(0) : '—'}</span>
                  </div>
                  <div className="flex justify-between bg-slate-950/50 px-2 py-1 rounded">
                    <span className="text-slate-400">Turb:</span>
                    <span className="text-cyan-300">{activeSingleSample.turbidity ? activeSingleSample.turbidity.toFixed(2) : '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-400 mb-5">
                No sample selected. Please choose a sample from the dropdown above.
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadSingle}
            disabled={downloadingSingle || !selectedSingleId}
            className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingSingle ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Generating Sample #{selectedSingleId} PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-cyan-400" />
                Download Sample #{selectedSingleId || '—'} PDF Report
              </>
            )}
          </button>
        </div>

        {/* Mode C: Multiple Selected Samples Report */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Mode C</span>
                  <h3 className="text-lg font-bold text-white">Multiple Selected Samples Report</h3>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Custom Batch
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Select specific water quality test records to include in a custom tailored PDF report.
              Ideal for periodic sampling cycles, single-station audits, or comparative batch verification.
            </p>

            {/* Search and Action Toolbar */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter samples by ID, verdict, or source..."
                  value={multiSearchQuery}
                  onChange={(e) => setMultiSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllVisible}
                    type="button"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    Select All ({filteredMultiSamples.length})
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={handleClearAll}
                    type="button"
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  Selected:{' '}
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold ml-1">
                    {selectedIds.size}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox Sample Selection Table */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80 mb-5">
              {filteredMultiSamples.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No sample records match your search filter.
                </div>
              ) : (
                filteredMultiSamples.map((sample) => {
                  const isChecked = selectedIds.has(sample.id);
                  return (
                    <div
                      key={sample.id}
                      onClick={() => toggleSelectId(sample.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-cyan-950/30 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-white mr-2">#{sample.id}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(sample.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          pH {sample.ph ? sample.ph.toFixed(2) : '—'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sample.is_potable
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {sample.is_potable ? 'POTABLE' : 'UNSAFE'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={handleDownloadSelected}
            disabled={downloadingSelected || selectedIds.size === 0}
            className="w-full py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 hover:border-purple-400 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingSelected ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                Generating Batch PDF ({selectedIds.size} Samples)...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-purple-400" />
                Download Selected Samples PDF ({selectedIds.size} Selected)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Standards & Methodological References Footer */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Official Regulatory Compliance &amp; Verification Methodology
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Every report generated by AquaWatch AI incorporates dual validation:
          <strong> (1) Scientific Parameter Screening</strong> according to Bureau of Indian Standards <strong>BIS IS 10500:2012</strong> drinking water specifications (acceptable vs. permissible limits for pH, Hardness, TDS, Turbidity, and Sulphate), and <strong>(2) Machine Learning Classification</strong> utilizing an ensemble Balanced Random Forest model.
          Per statutory guidelines, drinking water potability requires confirmed absence of coliform bacteria (0 MPN / 100 mL) and certified laboratory trace testing.
        </p>
      </div>
    </div>
  );
}
