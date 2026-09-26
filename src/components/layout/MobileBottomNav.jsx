import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutGrid,
  ScanLine,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';

export const MobileBottomNav = () => {
  const { activeTab, setActiveTab, documents } = useApp();

  const handleTabClick = (tabId) => {
    soundFx.playClick();
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => handleTabClick('dashboard')}
        className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        aria-label="Home"
      >
        <div className="mobile-nav-icon-wrap">
          <LayoutGrid size={20} />
        </div>
        <span className="mobile-nav-label">Home</span>
      </button>

      {/* 2. Scan */}
      <button
        type="button"
        onClick={() => handleTabClick('scanner')}
        className={`mobile-nav-item ${activeTab === 'scanner' ? 'active' : ''}`}
        aria-label="Scan"
      >
        <div className="mobile-nav-icon-wrap">
          <ScanLine size={20} />
        </div>
        <span className="mobile-nav-label">Scan</span>
      </button>

      {/* 3. Receipts */}
      <button
        type="button"
        onClick={() => handleTabClick('documents')}
        className={`mobile-nav-item ${activeTab === 'documents' ? 'active' : ''}`}
        aria-label="Receipts"
      >
        <div className="mobile-nav-icon-wrap" style={{ position: 'relative' }}>
          <FileText size={20} />
          {documents.length > 0 && (
            <span className="mobile-nav-badge">{documents.length}</span>
          )}
        </div>
        <span className="mobile-nav-label">Receipts</span>
      </button>

      {/* 4. Insights */}
      <button
        type="button"
        onClick={() => handleTabClick('insights')}
        className={`mobile-nav-item ${activeTab === 'insights' ? 'active' : ''}`}
        aria-label="Insights"
      >
        <div className="mobile-nav-icon-wrap">
          <BarChart3 size={20} />
        </div>
        <span className="mobile-nav-label">Insights</span>
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        onClick={() => handleTabClick('settings')}
        className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        aria-label="Settings"
      >
        <div className="mobile-nav-icon-wrap">
          <Settings size={20} />
        </div>
        <span className="mobile-nav-label">Settings</span>
      </button>
    </nav>
  );
};
