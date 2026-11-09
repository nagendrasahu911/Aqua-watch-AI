import React, { useState } from 'react';
import { MapPin, Navigation, Droplets, CheckCircle2, AlertTriangle, ShieldCheck, Layers, Radio } from 'lucide-react';

const SENSOR_STATIONS = [
  {
    id: 'STN-01',
    name: 'Metropolitan Reservoir North',
    lat: 37.7749,
    lng: -122.4194,
    coordinates: '37.7749° N, 122.4194° W',
    status: 'OPTIMAL',
    ph: 7.2,
    tds: 420,
    turbidity: 1.2,
    potability: 'Potable (Safe)',
    updated: '2 mins ago',
    description: 'Primary municipal drinking reservoir with multi-stage sand bed filtration.'
  },
  {
    id: 'STN-02',
    name: 'Industrial District Treatment Facility',
    lat: 37.7833,
    lng: -122.4167,
    coordinates: '37.7833° N, 122.4167° W',
    status: 'WARNING',
    ph: 8.8,
    tds: 1850,
    turbidity: 4.8,
    potability: 'Anomalous',
    updated: 'Just now',
    description: 'Automated telemetry point monitoring chemical runoff and industrial neutralizers.'
  },
  {
    id: 'STN-03',
    name: 'Aquifer Well Station #4',
    lat: 37.7650,
    lng: -122.4300,
    coordinates: '37.7650° N, 122.4300° W',
    status: 'OPTIMAL',
    ph: 7.4,
    tds: 310,
    turbidity: 0.8,
    potability: 'Potable (Safe)',
    updated: '5 mins ago',
    description: 'Subterranean deep well providing clean mineral-balanced water.'
  },
  {
    id: 'STN-04',
    name: 'River Estuary Intake Basin',
    lat: 37.7900,
    lng: -122.4000,
    coordinates: '37.7900° N, 122.4000° W',
    status: 'ALERT',
    ph: 5.9,
    tds: 3200,
    turbidity: 7.2,
    potability: 'Non-Potable (Unsafe)',
    updated: '10 mins ago',
    description: 'Surface intake point subject to seasonal sedimentation and agricultural runoff.'
  }
];

export default function MonitoringLocations() {
  const [selectedStation, setSelectedStation] = useState(SENSOR_STATIONS[0]);

  // Construct standard OpenStreetMap embed URL with marker bounding
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${selectedStation.lng - 0.025}%2C${selectedStation.lat - 0.02}%2C${selectedStation.lng + 0.025}%2C${selectedStation.lat + 0.02}&layer=mapnik&marker=${selectedStation.lat}%2C${selectedStation.lng}`;

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          IoT Monitoring Stations & OpenStreetMap Spatial Telemetry
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Geographic telemetry feeds monitoring municipal water sources, filtration plants, and regional aquifers with interactive OpenStreetMap cartography.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Station Roster */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Active Grid Stations</span>
            <span className="font-mono text-cyan-400">{SENSOR_STATIONS.length} Online</span>
          </div>
          {SENSOR_STATIONS.map((station) => (
            <div
              key={station.id}
              onClick={() => setSelectedStation(station)}
              className={`p-4 rounded-2xl glass-panel border cursor-pointer transition-all ${
                selectedStation.id === station.id
                  ? 'border-cyan-400 shadow-lg shadow-cyan-950/60 bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-300">{station.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  station.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400' :
                  station.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {station.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{station.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{station.coordinates}</p>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Verdict: <strong className="text-slate-200">{station.potability}</strong></span>
                <span className="text-[10px] text-cyan-400 font-mono">{station.updated}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Map & Live Sensor HUD */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  {selectedStation.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedStation.coordinates}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Live Node Feed
              </span>
            </div>

            {/* Embedded OpenStreetMap Display */}
            <div className="h-72 rounded-2xl overflow-hidden border border-cyan-500/30 relative shadow-inner bg-slate-950">
              <iframe
                title={`OpenStreetMap-${selectedStation.id}`}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={osmUrl}
                className="w-full h-full filter invert contrast-125 brightness-90 hue-rotate-180 opacity-90"
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-cyan-300 font-mono">
                Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a>
              </div>
            </div>

            {/* Live Station Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Sensor pH</div>
                <div className="text-xl font-bold text-white mt-1">{selectedStation.ph}</div>
                <div className="text-[10px] text-cyan-400">WHO: 6.5 - 8.5</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">TDS (ppm)</div>
                <div className="text-xl font-bold text-white mt-1">{selectedStation.tds}</div>
                <div className="text-[10px] text-cyan-400">WHO: &lt; 1000</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Turbidity (NTU)</div>
                <div className="text-xl font-bold text-white mt-1">{selectedStation.turbidity}</div>
                <div className="text-[10px] text-cyan-400">WHO: &lt; 5.0</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              <strong className="text-cyan-300">Station Description:</strong> {selectedStation.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Station Deployment: Municipal Water Grid</span>
            <span className="text-emerald-400 font-semibold">Encrypted MQTT Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
