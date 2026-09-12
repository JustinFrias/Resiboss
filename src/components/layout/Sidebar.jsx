import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ResibossLogo } from '../ui/ResibossLogo';
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
  FileText,
  Calendar,
  Clock,
  User,
  Bell,
  LogOut,
} from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';
import { ResiboBuddyMascot } from '../ui/ResiboBuddyMascot';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    activeSettingTab,
    setActiveSettingTab,
    userProfile,
    signOut,
    theme,
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
    setIsTermsOpen,
  } = useApp();

  const isLight = theme === 'light';

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'scanner', label: t.nav.scanner, icon: ScanLine, highlight: true },
    { id: 'documents', label: t.nav.documents, icon: FolderArchive, badge: documents.length },
    { id: 'analytic', label: t.nav.analytic, icon: BarChart3 },
    { id: 'export', label: t.nav.export, icon: Download },
  ];

  // Live Date & Time for sidebar widget
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

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
        {activeTab === 'settings' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 14px', boxSizing: 'border-box' }}>
            {/* Drawer Header (Screenshot 1) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ResiboBuddyMascot size={36} />
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0f2942' : '#ffffff', letterSpacing: '-0.02em' }}>
                  Resibo <span style={{ color: '#0d9488' }}>Buddy</span>
                </span>
              </div>
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isLight ? '#475569' : '#cbd5e1',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Close Settings Menu"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Section Title */}
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isLight ? '#64748b' : '#94a3b8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                paddingLeft: '4px',
              }}
            >
              SETTINGS
            </div>

            {/* Navigation List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'profile', label: 'Profile', icon: User, chevron: true },
                { id: 'categories', label: 'Categories', icon: FolderArchive },
                { id: 'security', label: 'Security', icon: ShieldCheck },
                { id: 'notifications', label: 'Notifications', icon: Bell },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSettingTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundFx?.playClick?.();
                      setActiveSettingTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive
                        ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.22)')
                        : 'transparent',
                      color: isActive
                        ? (isLight ? '#1e40af' : '#38bdf8')
                        : (isLight ? '#334155' : '#cbd5e1'),
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon
                        size={19}
                        color={isActive ? (isLight ? '#1e40af' : '#38bdf8') : (isLight ? '#475569' : '#94a3b8')}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.chevron && (
                      <ChevronRight
                        size={17}
                        color={isActive ? (isLight ? '#1e40af' : '#38bdf8') : '#94a3b8'}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Bottom Area: Sign Out & User Profile */}
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  if (onCloseMobile) onCloseMobile();
                  signOut?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? '#0f2942' : '#f87171',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '16px',
                  textAlign: 'left',
                }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>

              <div
                style={{
                  height: '1px',
                  background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 6px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#0b1e36',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {userProfile?.photo ? (
                    <img
                      src={userProfile.photo}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                      {(userProfile?.firstName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: isLight ? '#0f2942' : '#ffffff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {userProfile?.firstName || 'Justinfrias951'} {userProfile?.lastName || 'User'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: isLight ? '#64748b' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {userProfile?.email || 'justinfrias951@gmail.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
            {/* Settings (Collapsed) */}
            <button
              onClick={() => handleNavClick('settings')}
              title={t.nav.settings || 'Settings'}
              className={`sidebar-nav-btn collapsed ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings
                size={20}
                className="sidebar-nav-icon"
                strokeWidth={activeTab === 'settings' ? 2.4 : 2}
              />
            </button>

            {/* Live Clock Mini Pill (Collapsed) */}
            <div
              title={`${formattedDate} • ${formattedTime}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                gap: '3px',
                width: '42px',
                cursor: 'default',
              }}
            >
              <Clock size={14} color="#3b82f6" />
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#ffffff' }}>
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
              </span>
            </div>

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

            {/* Terms & Conditions (Collapsed) */}
            <button
              type="button"
              onClick={() => {
                soundFx?.playClick?.();
                setIsTermsOpen(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="Terms & Conditions"
            >
              <FileText size={16} />
            </button>
          </div>
        ) : (
          /* Expanded Bottom Controls */
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Settings Nav Item (Placed at the top of bottom section, above Language & Currency) */}
            <button
              key="settings"
              onClick={() => handleNavClick('settings')}
              className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              style={{ width: '100%', margin: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Settings
                  size={18}
                  className="sidebar-nav-icon"
                  strokeWidth={activeTab === 'settings' ? 2.4 : 2}
                />
                <span style={{ fontSize: '0.92rem' }}>{t.nav.settings || 'Settings'}</span>
              </div>
            </button>

            {/* Real-time Date & Time Pill (Matching User Screenshot, placed directly below Settings & above Language) */}
            <div
              style={{
                background: 'var(--bg-surface-elevated, rgba(15, 23, 42, 0.65))',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--glass-shadow-sm, inset 0 1px 2px rgba(0, 0, 0, 0.35))',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#3b82f6" strokeWidth={2} />
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px',
                  }}
                >
                  {formattedDate}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="#3b82f6" strokeWidth={2} />
                <span
                  style={{
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.3px',
                  }}
                >
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Quick Language & Currency Row (Now below Settings & Date/Time) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginTop: '2px' }}>
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
                    background: isLangOpen ? 'rgba(0, 242, 254, 0.12)' : 'var(--glass-border)',
                    border: isLangOpen ? '1px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
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
                          if (language !== l.code) e.currentTarget.style.background = 'var(--glass-border)';
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
                    background: isCurrOpen ? 'rgba(0, 242, 254, 0.12)' : 'var(--glass-border)',
                    border: isCurrOpen ? '1px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
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
                          if (currency !== c) e.currentTarget.style.background = 'var(--glass-border)';
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

            {/* Legal / Terms Link */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-2px' }}>
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setIsTermsOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 6px',
                  transition: 'color 0.2s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#00f2fe')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <FileText size={12} />
                <span>Terms & Conditions</span>
              </button>
            </div>
          </div>
        )}
        </>
      )}
      </aside>
    </>
  );
};
