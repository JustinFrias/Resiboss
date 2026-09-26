import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from '@capacitor/splash-screen';
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
  InAppToast,
  ErrorBoundary,
  AppLoadingScreen,
  PullToRefresh,
  UpdateAvailableBanner,
} from './components';

import { DashboardView } from './views/DashboardView';
import { ScannerView } from './views/ScannerView';
import { DocumentsView } from './views/DocumentsView';
import { AnalyticView } from './views/AnalyticView';
import { ExportView } from './views/ExportView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { InsightsView } from './views/InsightsView';
import { ShoppingListView } from './views/ShoppingListView';
import { AskResibossView } from './views/AskResibossView';

import './styles/liquid-glass.css';
import './styles/resiboss2.css';

const MainLayout = () => {
  const { activeTab, sidebarCollapsed, userProfile, isAuthResolving } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const viewportRef = useRef(null);

  // Instantly dismiss native Android splash screen on boot
  useEffect(() => {
    try {
      SplashScreen.hide().catch(() => {});
    } catch (e) {}
  }, []);

  // Instantly scroll to top of the content area on every tab switch
  useLayoutEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
    // Also reset window scroll (for mobile)
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Watchdog safety net: guarantee that AppLoadingScreen never blocks cold start for more than 1.5s
  const [authTimeoutReached, setAuthTimeoutReached] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimeoutReached(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // While resolving auth state on cold start (only online with no cached session, max 1.5s timeout)
  if (isAuthResolving && !userProfile && !authTimeoutReached) {
    return <AppLoadingScreen />;
  }

  // If not logged in, show Login / Sign Up screen first
  if (!userProfile) {
    return (
      <ErrorBoundary>
        <AuthView />
      </ErrorBoundary>
    );
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
      case 'insights':
        return <InsightsView />;
      case 'shopping':
        return <ShoppingListView />;
      case 'ask':
        return <AskResibossView />;
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
            <ErrorBoundary key={activeTab}>
              <div className="view-page">
                {renderActiveView()}
              </div>
            </ErrorBoundary>
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
  // Instantly dismiss native Android splash screen on boot
  useEffect(() => {
    try {
      SplashScreen.hide().catch(() => {});
    } catch (e) {}
  }, []);

  return (
    <AppProvider>
      <MobileAppGatekeeper>
        <PullToRefresh>
          <MainLayout />
        </PullToRefresh>
      </MobileAppGatekeeper>
      <InAppToast />
      <PrivacyPolicyModal />
      <TermsModal />
      <CookieConsentBanner />
    </AppProvider>
  );
}
