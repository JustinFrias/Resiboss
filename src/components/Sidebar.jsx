import React from 'react';
import { useApp } from '../context/AppContext';
import { ResibossLogo } from './ResibossLogo';
import {
  LayoutDashboard,
  ScanLine,
  FolderArchive,
  BarChart3,
  Download,
  Settings,
  Globe,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    language,
    setLanguage,
    currency,
    setCurrency,
    settings,
    setSettings,
    documents,
    t,
    sidebarCollapsed,
    toggleSidebar,
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'scanner', label: t.nav.scanner, icon: ScanLine, highlight: true },
    { id: 'documents', label: t.nav.documents, icon: FolderArchive, badge: documents.length },
    { id: 'analytic', label: t.nav.analytic, icon: BarChart3 },
    { id: 'export', label: t.nav.export, icon: Download },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fil', label: 'FIL' },
    { code: 'es', label: 'ES' },
    { code: 'ja', label: 'JA' },
  ];

  const currencies = ['PHP', 'USD', 'EUR', 'JPY'];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 95,
          }}
        />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Brand Logo Section */}
        <div>
          {sidebarCollapsed ? (
            /* Collapsed Header */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <ResibossLogo
                size={44}
                collapsed={true}
                onClick={() => handleNavClick('dashboard')}
              />

              {/* Expand Button */}
              <button
                onClick={toggleSidebar}
                title="Expand Sidebar"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                  e.currentTarget.style.color = '#00f2fe';
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            /* Expanded Header */
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <ResibossLogo
                size={44}
                onClick={() => handleNavClick('dashboard')}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Minimize Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  title="Minimize Sidebar"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                    e.currentTarget.style.color = '#00f2fe';
                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Mobile Close Button */}
                {onCloseMobile && (
                  <button
                    onClick={onCloseMobile}
                    className="mobile-close-btn"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items (Vertical Stack) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (sidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={item.label}
                    className={`sidebar-nav-btn collapsed ${isActive ? 'active' : ''}`}
                  >
                    <Icon
                      size={20}
                      className="sidebar-nav-icon"
                      strokeWidth={isActive ? 2.4 : 2}
                    />

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="sidebar-nav-badge">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isActive && <div className="sidebar-active-indicator" />}
                    <Icon
                      size={18}
                      className="sidebar-nav-icon"
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    <span style={{ fontSize: '0.92rem' }}>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`sidebar-nav-badge ${isActive ? 'active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Controls & Vault Status */}
        {sidebarCollapsed ? (
          /* Collapsed Bottom Controls */
          <div
            style={{
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Sound FX Toggle */}
            <button
              onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: settings.soundEnabled ? '#00f2fe' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title={settings.soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
            >
              {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Vault Status Indicator */}
            <div
              title="Vault Active • 100% Client-Side"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(10, 15, 30, 0.55)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'help',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
            </div>
          </div>
        ) : (
          /* Expanded Bottom Controls */
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Quick Language & Currency Row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="sidebar-select"
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '6px 8px',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} style={{ background: '#090d1a', color: '#fff' }}>
                    {l.label}
                  </option>
                ))}
              </select>

              {/* Currency Selector */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="sidebar-select"
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#00f2fe',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '6px 8px',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Currency"
              >
                {currencies.map((c) => (
                  <option key={c} value={c} style={{ background: '#090d1a', color: '#fff' }}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Sound FX Toggle */}
              <button
                onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: settings.soundEnabled ? '#00f2fe' : 'var(--text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title={settings.soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              >
                {settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>

            {/* System Encrypted Status Bar */}
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(10, 15, 30, 0.55)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span style={{ fontWeight: 600, color: '#34d399' }}>Vault Active</span>
              <span>• 100% Client-Side</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
