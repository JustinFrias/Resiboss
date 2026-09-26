import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutGrid,
  FileText,
  Camera,
  TrendingUp,
  MoreHorizontal,
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

      {/* 2. Receipts */}
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

      {/* 3. Hero Center Scan Action */}
      <button
        type="button"
        onClick={() => handleTabClick('scanner')}
        className={`mobile-nav-hero-btn ${activeTab === 'scanner' ? 'active' : ''}`}
        aria-label="Scan Receipt"
      >
        <div className="mobile-nav-hero-circle">
          <Camera size={24} strokeWidth={2.4} />
        </div>
        <span className="mobile-nav-label" style={{ marginTop: '2px', fontWeight: 700, color: activeTab === 'scanner' ? '#818CF8' : 'var(--text-secondary)' }}>
          Scan
        </span>
      </button>

      {/* 4. Insights */}
      <button
        type="button"
        onClick={() => handleTabClick('insights')}
        className={`mobile-nav-item ${activeTab === 'insights' ? 'active' : ''}`}
        aria-label="Insights"
      >
        <div className="mobile-nav-icon-wrap">
          <TrendingUp size={20} />
        </div>
        <span className="mobile-nav-label">Insights</span>
      </button>

      {/* 5. More (Settings & Preferences) */}
      <button
        type="button"
        onClick={() => handleTabClick('settings')}
        className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        aria-label="More"
      >
        <div className="mobile-nav-icon-wrap">
          <MoreHorizontal size={20} />
        </div>
        <span className="mobile-nav-label">More</span>
      </button>
    </nav>
  );
};
