import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import OverviewPage from './pages/OverviewPage';
import InterfacesPage from './pages/InterfacesPage';
import InterfaceDetailPage from './pages/InterfaceDetailPage';
import DependenciesPage from './pages/DependenciesPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { RepositoryIntake } from './pages/RepositoryIntake';
import AnalysisProgressPage from './pages/AnalysisProgressPage';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Landing / Repository Intake */}
          <Route path="/" element={<RepositoryIntake />} />
          <Route path="/import" element={<RepositoryIntake />} />

          {/* Analysis Pipeline Progress */}
          <Route path="/analysis" element={<AnalysisProgressPage />} />
          <Route path="/analysis/:runId" element={<AnalysisProgressPage />} />

          {/* Core Forensic Application (Built from Zip) */}
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/interfaces" element={<InterfacesPage />} />
          <Route path="/interfaces/:id" element={<InterfaceDetailPage />} />
          <Route path="/dependencies" element={<DependenciesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
