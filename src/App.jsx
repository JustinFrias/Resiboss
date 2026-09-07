import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LiquidBackground3D } from './components/LiquidBackground3D';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ReceiptViewer3D } from './components/ReceiptViewer3D';
import { MobileBottomNav } from './components/MobileBottomNav';

import { DashboardView } from './views/DashboardView';
import { ScannerView } from './views/ScannerView';
import { DocumentsView } from './views/DocumentsView';
import { AnalyticView } from './views/AnalyticView';
import { ExportView } from './views/ExportView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';

import './styles/liquid-glass.css';

const MainLayout = () => {
  const { activeTab, sidebarCollapsed, userProfile } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not logged in, show Login / Sign Up screen first
  if (!userProfile) {
    return <AuthView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView key="dashboard" />;
      case 'scanner':
        return <ScannerView key="scanner" />;
      case 'documents':
        return <DocumentsView key="documents" />;
      case 'analytic':
        return <AnalyticView key="analytic" />;
      case 'export':
        return <ExportView key="export" />;
      case 'settings':
        return <SettingsView key="settings" />;
      default:
        return <DashboardView key="dashboard-default" />;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
      }}
    >
      {/* 3D Liquid Canvas Background */}
      <LiquidBackground3D />

      {/* Main Application Flex Shell with Left Sidebar */}
      <div className="app-container">
        {/* Left Side Bar */}
        <Sidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Right Main Content Panel */}
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <TopBar onOpenMobile={() => setMobileMenuOpen(true)} />

          <main className="view-viewport">
            {renderActiveView()}
          </main>
        </div>

        {/* Interactive 3D Receipt Inspection Modal */}
        <ReceiptViewer3D />

        {/* Dedicated Mobile / Android Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
