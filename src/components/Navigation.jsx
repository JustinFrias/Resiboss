import React from 'react';
import { useApp } from '../context/AppContext';
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
} from 'lucide-react';

export const Navigation = () => {
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
    { code: 'fil', label: 'FIL (Resibo)' },
    { code: 'es', label: 'ES' },
    { code: 'ja', label: 'JA' },
  ];

  const currencies = ['PHP', 'USD', 'EUR', 'JPY'];

  return (
    <header
      className="glass-panel"
      style={{
        position: 'sticky',
        top: '16px',
        zIndex: 100,
        margin: '0 auto 24px auto',
        maxWidth: '1360px',
        width: 'calc(100% - 32px)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        backdropFilter: 'blur(28px) saturate(200%)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.12)',
      }}
    >
      {/* Brand Logo & Tag */}
      <div
        onClick={() => setActiveTab('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)',
            transform: 'rotate(-4deg)',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(-4deg) scale(1)')}
        >
          <ScanLine size={22} color="#030712" strokeWidth={2.4} />
        </div>
        <div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 40%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {t.appName}
            <span
              style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: '#00f2fe',
                background: 'rgba(0, 242, 254, 0.12)',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 242, 254, 0.3)',
              }}
            >
              3D OCR
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {t.tagline}
          </div>
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(7, 12, 26, 0.45)',
          padding: '5px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: isActive
                  ? '1px solid rgba(0, 242, 254, 0.4)'
                  : '1px solid transparent',
                background: isActive
                  ? item.highlight
                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(168, 85, 247, 0.25))'
                    : 'rgba(255, 255, 255, 0.1)'
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                position: 'relative',
                boxShadow: isActive ? '0 0 15px rgba(0, 242, 254, 0.2)' : 'none',
              }}
            >
              <Icon
                size={16}
                color={isActive ? (item.highlight ? '#00f2fe' : '#ffffff') : '#94a3b8'}
              />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(0, 242, 254, 0.2)',
                    color: '#00f2fe',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Language, Currency, Sound */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Currency Selector */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#00f2fe',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
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

        {/* Language Selector */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
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
        </div>

        {/* Sound FX Toggle */}
        <button
          onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: settings.soundEnabled ? '#00f2fe' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={settings.soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
        >
          {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
};
