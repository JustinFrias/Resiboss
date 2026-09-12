import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutGrid,
  ScanLine,
  FileText,
  Download,
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
      {/* 1. Home Tab */}
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

      {/* 2. Scan Tab */}
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

      {/* 3. Docs Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('documents')}
        className={`mobile-nav-item ${activeTab === 'documents' ? 'active' : ''}`}
        aria-label="Docs"
      >
        <div className="mobile-nav-icon-wrap" style={{ position: 'relative' }}>
          <FileText size={20} />
          {documents.length > 0 && (
            <span className="mobile-nav-badge">{documents.length}</span>
          )}
        </div>
        <span className="mobile-nav-label">Docs</span>
      </button>

      {/* 4. Download Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('export')}
        className={`mobile-nav-item ${activeTab === 'export' ? 'active' : ''}`}
        aria-label="Download"
      >
        <div className="mobile-nav-icon-wrap">
          <Download size={20} />
        </div>
        <span className="mobile-nav-label">Download</span>
      </button>

      {/* 5. Stats Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('analytic')}
        className={`mobile-nav-item ${activeTab === 'analytic' ? 'active' : ''}`}
        aria-label="Stats"
      >
        <div className="mobile-nav-icon-wrap">
          <BarChart3 size={20} />
        </div>
        <span className="mobile-nav-label">Stats</span>
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
        <span className="mobile-nav-label">Settings</span>
      </button>
    </nav>
  );
};
