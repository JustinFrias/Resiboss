import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  FolderArchive,
  ScanLine,
  BarChart3,
  Settings,
} from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';

export const MobileBottomNav = () => {
  const { activeTab, setActiveTab, documents, t } = useApp();

  const handleTabClick = (tabId) => {
    soundFx.playClick();
    setActiveTab(tabId);
    // Scroll smoothly to top on tab change for easy access
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Dashboard Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('dashboard')}
        className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        aria-label="Dashboard"
      >
        <div className="mobile-nav-icon-wrap">
          <LayoutDashboard size={20} />
        </div>
        <span className="mobile-nav-label">{t.nav?.dashboard || 'Dashboard'}</span>
      </button>

      {/* 2. Documents / Vault Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('documents')}
        className={`mobile-nav-item ${activeTab === 'documents' ? 'active' : ''}`}
        aria-label="Documents"
      >
        <div className="mobile-nav-icon-wrap" style={{ position: 'relative' }}>
          <FolderArchive size={20} />
          {documents.length > 0 && (
            <span className="mobile-nav-badge">{documents.length}</span>
          )}
        </div>
        <span className="mobile-nav-label">{t.nav?.documents || 'Vault'}</span>
      </button>

      {/* 3. Hero Center Scanner Action Button */}
      <button
        type="button"
        onClick={() => handleTabClick('scanner')}
        className={`mobile-nav-hero-btn ${activeTab === 'scanner' ? 'active' : ''}`}
        aria-label="Scan Receipt"
      >
        <div className="mobile-nav-hero-circle">
          <ScanLine size={24} />
        </div>
        <span className="mobile-nav-hero-label">{t.nav?.scanner || 'Scan'}</span>
      </button>

      {/* 4. Analytics Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('analytic')}
        className={`mobile-nav-item ${activeTab === 'analytic' ? 'active' : ''}`}
        aria-label="Analytics"
      >
        <div className="mobile-nav-icon-wrap">
          <BarChart3 size={20} />
        </div>
        <span className="mobile-nav-label">{t.nav?.analytic || 'Analytics'}</span>
      </button>

      {/* 5. Settings Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('settings')}
        className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        aria-label="Settings"
      >
        <div className="mobile-nav-icon-wrap">
          <Settings size={20} />
        </div>
        <span className="mobile-nav-label">{t.nav?.settings || 'Settings'}</span>
      </button>
    </nav>
  );
};
