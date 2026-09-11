import React, { useState, useRef, useLayoutEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
  LiquidBackground3D,
  Sidebar,
  TopBar,
  ReceiptViewer3D,
  MobileBottomNav,
  MobileAppGatekeeper,
  TermsModal,
  PrivacyPolicyModal,
  CookieConsentBanner,
} from './components';

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
  const viewportRef = useRef(null);

  // Instantly scroll to top of the content area on every tab switch
  useLayoutEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
    // Also reset window scroll (for mobile)
    window.scrollTo(0, 0);
  }, [activeTab]);

  // If not logged in, show Login / Sign Up screen first
  if (!userProfile) {
    return <AuthView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'scanner':
        return <ScannerView />;
      case 'documents':
        return <DocumentsView />;
      case 'analytic':
        return <AnalyticView />;
      case 'export':
        return <ExportView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        color: 'var(--text-primary)',
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

          <main ref={viewportRef} className="view-viewport">
            {/* key=activeTab forces a fresh mount + CSS animation on every tab switch */}
            <div key={activeTab} className="view-page">
              {renderActiveView()}
            </div>
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
      <MobileAppGatekeeper>
        <MainLayout />
      </MobileAppGatekeeper>
      <PrivacyPolicyModal />
      <CookieConsentBanner />
    </AppProvider>
  );
}
