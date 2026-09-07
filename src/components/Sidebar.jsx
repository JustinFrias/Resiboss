import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  X,
  Smartphone,
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

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

  // Custom Liquid Glass Dropdown States
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrOpen, setIsCurrOpen] = useState(false);
  const langRef = useRef(null);
  const currRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
      if (currRef.current && !currRef.current.contains(e.target)) {
        setIsCurrOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 999,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
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
                className="sidebar-minimize-btn"
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
                  className="sidebar-minimize-btn"
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
                    title="Close Menu"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
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

          {/* Direct Android APK Download Button (1-Click .APK) */}
          <div style={{ marginTop: '16px' }}>
            {sidebarCollapsed ? (
              <a
                href="https://github.com/JustinFrias/Resiboss/releases/download/latest/Resiboss.apk"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(168, 85, 247, 0.15))',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  color: '#00f2fe',
                  textDecoration: 'none',
                }}
                title="Direct Download Resiboss.apk (No extraction needed!)"
              >
                <Smartphone size={18} />
              </a>
            ) : (
              <a
                href="https://github.com/JustinFrias/Resiboss/releases/download/latest/Resiboss.apk"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12), rgba(168, 85, 247, 0.12))',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: '#00f2fe',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                title="Direct Download Resiboss.apk (No extraction needed!)"
              >
                <Smartphone size={17} />
                <span>Get Android APK</span>
                <Download size={14} style={{ marginLeft: 'auto', opacity: 0.8 }} />
              </a>
            )}
          </div>
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
          </div>
        ) : (
          /* Expanded Bottom Controls */
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Quick Language & Currency Row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {/* Custom Liquid Glass Language Dropdown */}
              <div ref={langRef} style={{ position: 'relative', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLangOpen(!isLangOpen);
                    setIsCurrOpen(false);
                    soundFx.playClick();
                  }}
                  className="sidebar-select-btn"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isLangOpen ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                    border: isLangOpen ? '1px solid var(--cyan-glow)' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '6px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Select Language"
                >
                  <span>{languages.find((l) => l.code === language)?.label || 'EN'}</span>
                  <ChevronDown
                    size={13}
                    color="var(--text-muted)"
                    style={{
                      transform: isLangOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {isLangOpen && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: 0,
                      minWidth: '95px',
                      background: 'var(--bg-surface-elevated, #0a0f24)',
                      border: '1px solid var(--glass-border-bright)',
                      borderRadius: '12px',
                      padding: '4px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {languages.map((l) => (
                      <div
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangOpen(false);
                          soundFx.playClick();
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: language === l.code ? 700 : 500,
                          color: language === l.code ? 'var(--cyan-glow)' : 'var(--text-primary)',
                          background: language === l.code ? 'rgba(0, 242, 254, 0.14)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (language !== l.code) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          if (language !== l.code) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>{l.label}</span>
                        {language === l.code && (
                          <div
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#00f2fe',
                              boxShadow: '0 0 6px #00f2fe',
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Liquid Glass Currency Dropdown */}
              <div ref={currRef} style={{ position: 'relative', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCurrOpen(!isCurrOpen);
                    setIsLangOpen(false);
                    soundFx.playClick();
                  }}
                  className="sidebar-select-btn"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isCurrOpen ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                    border: isCurrOpen ? '1px solid var(--cyan-glow)' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#00f2fe',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '6px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Select Currency"
                >
                  <span>{currency}</span>
                  <ChevronDown
                    size={13}
                    color="var(--text-muted)"
                    style={{
                      transform: isCurrOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {isCurrOpen && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: 0,
                      minWidth: '95px',
                      background: 'var(--bg-surface-elevated, #0a0f24)',
                      border: '1px solid var(--glass-border-bright)',
                      borderRadius: '12px',
                      padding: '4px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {currencies.map((c) => (
                      <div
                        key={c}
                        onClick={() => {
                          setCurrency(c);
                          setIsCurrOpen(false);
                          soundFx.playClick();
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: currency === c ? 700 : 500,
                          color: currency === c ? 'var(--cyan-glow)' : 'var(--text-primary)',
                          background: currency === c ? 'rgba(0, 242, 254, 0.14)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (currency !== c) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          if (currency !== c) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>{c}</span>
                        {currency === c && (
                          <div
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#00f2fe',
                              boxShadow: '0 0 6px #00f2fe',
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
          </div>
        )}
      </aside>
    </>
  );
};
