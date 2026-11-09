import React, { useState, useEffect } from 'react';
import Sidebar, { navItems } from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import IoTMonitoring from './pages/IoTMonitoring';
import WaterAnalyzer from './pages/WaterAnalyzer';
import AIPrediction from './pages/AIPrediction';
import AnomalyDetection from './pages/AnomalyDetection';
import Analytics from './pages/Analytics';
import MonitoringLocations from './pages/MonitoringLocations';
import HistoricalRecords from './pages/HistoricalRecords';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';
import DatasetExplorer from './pages/DatasetExplorer';
import Settings from './pages/Settings';
import About from './pages/About';

import { getHealth, getDashboardStats, getHistory } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Backend States
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGlobalData = async () => {
    setIsRefreshing(true);
    try {
      const [hRes, sRes, histRes] = await Promise.allSettled([
        getHealth(),
        getDashboardStats(),
        getHistory(100, 0)
      ]);

      if (hRes.status === 'fulfilled') setHealthStatus(hRes.value);
      if (sRes.status === 'fulfilled') setStats(sRes.value);
      if (histRes.status === 'fulfilled') setHistory(histRes.value);
    } catch (err) {
      console.error('Failed to sync backend:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const currentNav = navItems.find((item) => item.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        {/* Sticky Navbar */}
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          currentTitle={currentNav.label}
          onRefresh={fetchGlobalData}
          isRefreshing={isRefreshing}
          healthStatus={healthStatus}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              history={history}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'iot' && (
            <IoTMonitoring />
          )}

          {activeTab === 'analyzer' && (
            <WaterAnalyzer
              onSampleEvaluated={fetchGlobalData}
            />
          )}

          {activeTab === 'prediction' && (
            <AIPrediction
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyDetection
              history={history}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              history={history}
              stats={stats}
            />
          )}

          {activeTab === 'locations' && (
            <MonitoringLocations />
          )}

          {activeTab === 'history' && (
            <HistoricalRecords
              history={history}
            />
          )}

          {activeTab === 'insights' && (
            <AIInsights
              stats={stats}
              history={history}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              stats={stats}
              history={history}
            />
          )}

          {activeTab === 'dataset' && (
            <DatasetExplorer
              onUploadSuccess={fetchGlobalData}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              healthStatus={healthStatus}
              onRefresh={fetchGlobalData}
            />
          )}

          {activeTab === 'about' && (
            <About />
          )}
        </main>
      </div>
    </div>
  );
}
