import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScanLine } from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';

export const MobileBottomNav = () => {
  const { activeTab, setActiveTab, t } = useApp();

  const handleScanClick = () => {
    soundFx.playClick();
    setActiveTab('scanner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* Solo Center Scanner FAB */}
      <button
        type="button"
        onClick={handleScanClick}
        className={`mobile-nav-hero-btn ${activeTab === 'scanner' ? 'active' : ''}`}
        aria-label="Scan Receipt"
      >
        <div className="mobile-nav-hero-circle">
          <ScanLine size={28} />
        </div>
        <span className="mobile-nav-hero-label">{t.nav?.scanner || 'Scanner'}</span>
      </button>
    </nav>
  );
};
