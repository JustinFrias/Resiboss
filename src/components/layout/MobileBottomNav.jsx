import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutGrid,
  ScanLine,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';
import { ResiboBuddyMascot } from '../ui/ResiboBuddyMascot';
import { BiboBuddyModal } from '../modals/BiboBuddyModal';
import { soundFx } from '../../utils/soundEffects';

export const MobileBottomNav = () => {
  const { activeTab, setActiveTab, documents, theme } = useApp();
  const [isBiboOpen, setIsBiboOpen] = useState(false);
  const isLight = theme === 'light';

  const handleTabClick = (tabId) => {
    soundFx.playClick();
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBiboClick = () => {
    soundFx.playSuccessChime();
    setIsBiboOpen(true);
  };

  return (
    <>
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

        {/* 4. Stats Tab */}
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

        {/* 5. Bibo AI Mascot Button */}
        <button
          type="button"
          onClick={handleBiboClick}
          className="mobile-nav-item"
          aria-label="Bibo Buddy"
          style={{ position: 'relative' }}
        >
          <div
            className="mobile-nav-icon-wrap"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: isLight ? 'rgba(45, 212, 191, 0.2)' : 'rgba(45, 212, 191, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 6px rgba(13, 148, 136, 0.25)',
            }}
          >
            <ResiboBuddyMascot size={22} showBadge={false} />
          </div>
          <span className="mobile-nav-label" style={{ color: isLight ? '#0d9488' : '#2dd4bf' }}>
            Bibo
          </span>
        </button>

        {/* 6. Settings Tab */}
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

      <BiboBuddyModal isOpen={isBiboOpen} onClose={() => setIsBiboOpen(false)} />
    </>
  );
};
