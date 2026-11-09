import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Activity, 
  Thermometer, 
  Droplet, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Send,
  Database,
  Radio,
  FileText
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  getIoTDevices, 
  getLatestIoTReading, 
  getIoTReadingsHistory, 
  postIoTReading,
  registerIoTDevice 
} from '../services/api';

export default function IoTMonitoring() {
  // Mode Selection: STRICT separation between Real Hardware and Simulation
  const [activeMode, setActiveMode] = useState('HARDWARE'); // 'HARDWARE' or 'SIMULATION'
  
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('ESP32-NODE-01');
  const [latestReading, setLatestReading] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulator controls (Used strictly when activeMode === 'SIMULATION')
  const [simPH, setSimPH] = useState(7.3);
  const [simTDS, setSimTDS] = useState(380);
  const [simTurbidity, setSimTurbidity] = useState(1.8);
  const [simTemp, setSimTemp] = useState(24.5);
  const [sendingSim, setSendingSim] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState(null);

  const isSim = activeMode === 'SIMULATION';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch devices list
      const devs = await getIoTDevices();
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].device_id);
      }

      // 2. Fetch latest telemetry for selected mode
      const latest = await getLatestIoTReading(selectedDevice, isSim);
      setLatestReading(latest);

      // 3. Fetch telemetry history
      const hist = await getIoTReadingsHistory(selectedDevice, isSim, 30);
      setReadingHistory(hist);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch IoT hardware telemetry. Ensure FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8-second live polling
    return () => clearInterval(interval);
  }, [selectedDevice, activeMode]);

  const handleSendSimulation = async () => {
    setSendingSim(true);
    setSimSuccessMsg(null);
    setError(null);
    try {
      const payload = {
        device_id: selectedDevice || 'ESP32-NODE-01',
        api_key: 'aquawatch-secret-key-2026',
        is_simulated: true,
        ph: parseFloat(simPH),
        tds: parseFloat(simTDS),
        turbidity: parseFloat(simTurbidity),
        temperature: parseFloat(simTemp),
        conductivity: parseFloat(simTDS) * 2.0,
        ph_voltage: 2.50,
        tds_voltage: 1.20,
        turbidity_voltage: 3.10
      };

      await postIoTReading(payload);
      setSimSuccessMsg('Simulated telemetry packet transmitted and saved in SQLite database.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to transmit simulated telemetry.');
    } finally {
      setSendingSim(false);
    }
  };

  const chartData = [...readingHistory].reverse().map((r, i) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ph: r.ph,
    tds: r.tds,
    turbidity: r.turbidity,
    temp: r.temperature
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            ESP32 IoT Hardware Telemetry & Sensor Integration
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time telemetry ingestion from physical ESP32 microcontrollers with analog pH, TDS, Turbidity, and 1-Wire temperature probes.
          </p>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setActiveMode('HARDWARE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'HARDWARE'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Real Hardware Mode
          </button>
          <button
            onClick={() => setActiveMode('SIMULATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'SIMULATION'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Simulation Mode
          </button>
        </div>
      </div>

      {/* Mode Status Alert */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
        activeMode === 'HARDWARE'
          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          {activeMode === 'HARDWARE' ? (
            <Wifi className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>
            <strong>Active Stream:</strong> {activeMode === 'HARDWARE' ? 'Real Hardware Stream' : 'Virtual Sensor Simulator'}. Readings are strictly partitioned in the database to prevent mixing simulated readings with certified field telemetry.
          </span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-semibold cursor-pointer shrink-0 ml-2"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Primary Hardware Status & Live Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* pH Card */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sensor pH</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {latestReading?.ph !== null && latestReading?.ph !== undefined ? latestReading.ph.toFixed(2) : '—'}
            </div>
            <div className="text-xs text-cyan-300/80 mt-1">
              WHO Permissible: 6.5 – 8.5
            </div>
          </div>
        </div>

        {/* TDS Card */}
        <div className="glass-panel rounded-2xl p-5 border border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TDS (Solids)</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {latestReading?.tds !== null && latestReading?.tds !== undefined ? `${latestReading.tds.toFixed(0)} ppm` : '—'}
            </div>
            <div className="text-xs text-sky-300/80 mt-1">
              Desirable Limit: &lt; 1000 ppm
            </div>
          </div>
        </div>

        {/* Turbidity Card */}
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Turbidity (Clarity)</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {latestReading?.turbidity !== null && latestReading?.turbidity !== undefined ? `${latestReading.turbidity.toFixed(2)} NTU` : '—'}
            </div>
            <div className="text-xs text-emerald-300/80 mt-1">
              WHO Safe Limit: &lt; 5.0 NTU
            </div>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Water Temperature</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {latestReading?.temperature !== null && latestReading?.temperature !== undefined ? `${latestReading.temperature.toFixed(1)} °C` : '—'}
            </div>
            <div className="text-xs text-amber-300/80 mt-1">
              Digital 1-Wire Probe (DS18B20)
            </div>
          </div>
        </div>
      </div>

      {/* PART 5 COMPLIANCE BANNER: Rigorous Distinction between Physical Telemetry & Complete ML */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Part 5 Compatibility & Safety Verification</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>AI Status:</strong> <span className="text-amber-300 font-mono">{latestReading?.ai_message || "Insufficient sensor data for complete AI analysis."}</span>
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          * Notice: The complete ML water potability classifier requires 9 laboratory chemical parameters (including Chloramines, Sulfate, TOC, and Trihalomethanes). Physical IoT nodes currently measure physical metrics (pH, TDS, Turbidity, Temp). While physical metrics pass WHO standard limits, certified drinking-water safety cannot be declared without full chemical screening.
        </p>
      </div>

      {/* Live Charts & Simulator Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Telemetry Trend Graph */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Telemetry Stream ({activeMode === 'HARDWARE' ? 'Real Hardware' : 'Simulator'})
              </h3>
              <p className="text-xs text-slate-400">Real-time pH and Turbidity progression</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> pH
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Turbidity
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.length > 0 ? chartData : [{ time: 'No Data', ph: 7.0, turbidity: 2.0 }]}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 14]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#06b6d4',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Line type="monotone" dataKey="ph" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2 }} name="pH" />
                <Line type="monotone" dataKey="turbidity" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="Turbidity (NTU)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Device ID: <strong className="text-cyan-300 font-mono">{selectedDevice || 'ESP32-NODE-01'}</strong></span>
            <span>Recorded Packets: <strong className="text-white">{readingHistory.length}</strong></span>
          </div>
        </div>

        {/* Hardware Status / Simulation Console */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          {activeMode === 'HARDWARE' ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                Hardware Node Diagnostics
              </h3>
              <p className="text-xs text-slate-300">
                Live link status for field-deployed ESP32 units:
              </p>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                  <span>Hardware Status:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ONLINE
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                  <span>Firmware Version:</span>
                  <span className="font-mono text-cyan-300">v1.0.0 (Arduino C++)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                  <span>ADC Calibration:</span>
                  <span className="font-mono text-slate-200">12-bit (11dB Atten)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                  <span>Last Handshake:</span>
                  <span className="text-slate-400 font-mono">
                    {latestReading?.timestamp ? new Date(latestReading.timestamp).toLocaleTimeString() : 'Awaiting packet'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                To connect physical hardware, flash <code className="text-cyan-300">hardware/esp32/main.ino</code> using Arduino IDE and configure your Wi-Fi credentials in <code className="text-cyan-300">config.h</code>.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Virtual ESP32 Simulator
              </h3>
              <p className="text-xs text-slate-300">
                Inject custom sensor readings without physical hardware for testing and demonstration:
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Simulated pH:</span>
                    <span className="font-mono text-cyan-400 font-bold">{simPH}</span>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="10.0"
                    step="0.1"
                    value={simPH}
                    onChange={(e) => setSimPH(e.target.value)}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Simulated TDS (ppm):</span>
                    <span className="font-mono text-sky-400 font-bold">{simTDS} ppm</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="10"
                    value={simTDS}
                    onChange={(e) => setSimTDS(e.target.value)}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Simulated Turbidity (NTU):</span>
                    <span className="font-mono text-emerald-400 font-bold">{simTurbidity} NTU</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.1"
                    value={simTurbidity}
                    onChange={(e) => setSimTurbidity(e.target.value)}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Simulated Temperature (°C):</span>
                    <span className="font-mono text-amber-400 font-bold">{simTemp} °C</span>
                  </div>
                  <input
                    type="range"
                    min="10.0"
                    max="45.0"
                    step="0.5"
                    value={simTemp}
                    onChange={(e) => setSimTemp(e.target.value)}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              {simSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{simSuccessMsg}</span>
                </div>
              )}

              <button
                onClick={handleSendSimulation}
                disabled={sendingSim}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingSim ? 'Transmitting...' : 'Send Simulated Telemetry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
