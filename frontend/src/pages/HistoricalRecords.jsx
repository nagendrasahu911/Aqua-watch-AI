import React, { useState } from 'react';
import { History, Search, Filter, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function HistoricalRecords({ history }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('ALL');

  const filteredHistory = (history || []).filter((item) => {
    const matchesSearch = item.id.toString().includes(searchTerm) ||
      (item.anomaly_reasons && item.anomaly_reasons.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterVerdict === 'POTABLE') return matchesSearch && item.is_potable;
    if (filterVerdict === 'UNSAFE') return matchesSearch && !item.is_potable;
    if (filterVerdict === 'ANOMALY') return matchesSearch && item.is_anomaly;
    return matchesSearch;
  });

  const exportCSV = () => {
    if (!history || history.length === 0) return;
    const headers = ["ID", "Date", "pH", "Hardness", "Solids", "Chloramines", "Sulfate", "Conductivity", "OrganicCarbon", "Trihalomethanes", "Turbidity", "Potable", "Confidence", "Verdict", "Source"];
    const rows = history.map(h => [
      h.id,
      h.created_at,
      h.ph,
      h.hardness,
      h.solids,
      h.chloramines,
      h.sulfate,
      h.conductivity,
      h.organic_carbon,
      h.trihalomethanes,
      h.turbidity,
      h.is_potable ? 1 : 0,
      h.confidence,
      `"${h.verdict}"`,
      h.source
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aquawatch_telemetry_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Historical Water Quality Telemetry Ledger
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Immutable SQLite audit log of every laboratory sample and batch CSV upload processed by the Machine Learning inference engine.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by sample ID or violation notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'POTABLE', 'UNSAFE', 'ANOMALY'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterVerdict(f)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  filterVerdict === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="w-full md:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export Ledger (.CSV)
        </button>
      </div>

      {/* Main Historical Table */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 rounded-l-lg">ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">pH</th>
                <th className="py-3 px-3">Hardness</th>
                <th className="py-3 px-3">Solids (ppm)</th>
                <th className="py-3 px-3">Chloramines</th>
                <th className="py-3 px-3">Sulfate</th>
                <th className="py-3 px-3">Conductivity</th>
                <th className="py-3 px-3">Organic Carbon</th>
                <th className="py-3 px-3">THM</th>
                <th className="py-3 px-3">Turbidity</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3 rounded-r-lg">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-300">#{row.id}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(row.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-3 font-mono">{row.ph !== null ? row.ph.toFixed(2) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.hardness !== null ? row.hardness.toFixed(1) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.solids !== null ? row.solids.toFixed(0) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.chloramines !== null ? row.chloramines.toFixed(2) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.sulfate !== null ? row.sulfate.toFixed(1) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.conductivity !== null ? row.conductivity.toFixed(1) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.organic_carbon !== null ? row.organic_carbon.toFixed(2) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.trihalomethanes !== null ? row.trihalomethanes.toFixed(1) : '—'}</td>
                  <td className="py-3 px-3 font-mono">{row.turbidity !== null ? row.turbidity.toFixed(2) : '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      row.is_potable 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {row.is_potable ? 'Potable' : 'Unsafe'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-200">
                    {(row.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                      {row.source}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500">
                    No matching records found.
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
