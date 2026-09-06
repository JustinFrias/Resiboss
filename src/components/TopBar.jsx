import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  CheckCheck,
  X,
  FileText,
  Sparkles,
  CloudDownload,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

export const TopBar = ({ onOpenMobile }) => {
  const {
    activeTab,
    setActiveTab,
    documents,
    setInspectingDoc,
    formatCurrency,
    t,
    theme,
    toggleTheme,
    notifications,
    markAllNotificationsAsRead,
    clearNotifications,
    userProfile,
  } = useApp();

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Notifications Popover State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.nav?.dashboard || 'Dashboard';
      case 'scanner':
        return t.nav?.scanner || 'Scanner';
      case 'documents':
        return t.nav?.documents || 'Documents';
      case 'analytic':
        return t.nav?.analytic || 'Analytic';
      case 'export':
        return t.nav?.export || 'Export';
      case 'settings':
        return t.nav?.settings || 'Settings';
      default:
        return 'Overview';
    }
  };

  // Global Ctrl+K / Cmd+K listener to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsNotifOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter documents in real time for search bar
  const filteredDocs = searchQuery.trim()
    ? documents.filter((doc) => {
        const q = searchQuery.toLowerCase();
        return (
          (doc.merchant && doc.merchant.toLowerCase().includes(q)) ||
          (doc.id && doc.id.toLowerCase().includes(q)) ||
          (doc.tin && doc.tin.toLowerCase().includes(q)) ||
          (doc.category && doc.category.toLowerCase().includes(q)) ||
          (doc.paymentMethod && doc.paymentMethod.toLowerCase().includes(q))
        );
      }).slice(0, 6)
    : [];

  const handleSelectSearchResult = (doc) => {
    soundFx.playClick();
    setInspectingDoc(doc);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleNotificationClick = (n) => {
    soundFx.playClick();
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );

    if (n.type === 'scanner' || n.id === 'notif-1') {
      const doc = documents.find((d) => d.id === 'REC-2025-001') || documents[0];
      if (doc) {
        setInspectingDoc(doc);
      }
      setActiveTab('documents');
    } else if (n.type === 'export' || n.id === 'notif-2') {
      setActiveTab('export');
    } else if (n.type === 'tax' || n.id === 'notif-3') {
      setActiveTab('documents');
    } else {
      setActiveTab('dashboard');
    }

    setIsNotifOpen(false);
  };

  const handleClearAllNotifications = (e) => {
    if (e) e.stopPropagation();
    soundFx.playClick();
    clearNotifications();
    setIsNotifOpen(false);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'scanner':
        return <Sparkles size={16} color="#00f2fe" />;
      case 'export':
        return <CloudDownload size={16} color="#10b981" />;
      case 'tax':
        return <ShieldCheck size={16} color="#a855f7" />;
      default:
        return <FileText size={16} color="#38bdf8" />;
    }
  };

  return (
    <header
      className="glass-panel topbar-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        marginBottom: '14px',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        background: 'var(--bg-surface)',
        gap: '16px',
        position: 'relative',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      {/* 1. Left: Mobile Menu & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button
          onClick={onOpenMobile}
          className="mobile-hamburger-btn"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t.appName || 'Resiboss'}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--cyan-glow)', fontWeight: 700 }}>{getBreadcrumb()}</span>
        </div>
      </div>

      {/* 2. Right: Search Bar + Theme Toggle + Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
        {/* Modern Interactive Search Bar */}
        <div
          ref={searchContainerRef}
          className={`topbar-search-container ${isSearchFocused ? 'is-focused' : ''}`}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          <div
            className="topbar-search-box"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: isSearchFocused ? '1px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
              boxShadow: isSearchFocused ? '0 0 16px var(--cyan-subtle)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Search size={15} color={isSearchFocused ? 'var(--cyan-glow)' : 'var(--text-muted)'} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search receipts, TIN, merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.84rem',
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <span
                className="topbar-kbd"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                ⌘K
              </span>
            )}
          </div>

          {/* Search Results Dropdown Popover */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--glass-border-bright)',
                borderRadius: '14px',
                padding: '8px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                animation: 'fadeIn 0.2s ease',
                maxHeight: '340px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '6px 10px',
                  borderBottom: '1px solid var(--glass-border)',
                  marginBottom: '6px',
                }}
              >
                Matching Receipts ({filteredDocs.length})
              </div>

              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectSearchResult(doc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cyan-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(0, 242, 254, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#00f2fe',
                        }}
                      >
                        <FileText size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {doc.merchant || 'Unknown Merchant'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {doc.date} • {doc.category || 'General'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--cyan-glow)' }}>
                        {formatCurrency(doc.total || 0)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {doc.id}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No receipts found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark Mode & Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: theme === 'dark' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(245, 158, 11, 0.16)',
            border: theme === 'dark' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme === 'dark' ? '#c084fc' : '#f59e0b',
            boxShadow: theme === 'dark' ? '0 0 15px rgba(168, 85, 247, 0.25)' : '0 0 15px rgba(245, 158, 11, 0.25)',
            transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications Button & Dropdown */}
        <div ref={notifContainerRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              soundFx.playClick();
            }}
            title="System Notifications"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: isNotifOpen ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: isNotifOpen ? '1px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isNotifOpen ? 'var(--cyan-glow)' : 'var(--text-secondary)',
              position: 'relative',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.8)',
                  animation: 'pulse 2s infinite',
                  pointerEvents: 'none',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover Dropdown */}
          {isNotifOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '320px',
                maxWidth: 'calc(100vw - 24px)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--glass-border-bright)',
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--glass-border)',
                  background: 'rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: 'var(--cyan-subtle)',
                        color: 'var(--cyan-glow)',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--cyan-glow)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCheck size={14} /> Mark read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div style={{ maxHeight: '290px', overflowY: 'auto', padding: '6px' }}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        marginBottom: '6px',
                        background: n.read ? 'transparent' : 'var(--cyan-subtle)',
                        border: n.read ? '1px solid transparent' : '1px solid var(--glass-border)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-surface-hover)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = n.read ? 'transparent' : 'var(--cyan-subtle)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getNotifIcon(n.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              marginBottom: '2px',
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.35,
                              marginBottom: '4px',
                            }}
                          >
                            {n.desc}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {n.time}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {!n.read && (
                          <div
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#00f2fe',
                              boxShadow: '0 0 8px #00f2fe',
                            }}
                          />
                        )}
                        <ArrowRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    No notifications
                  </div>
                )}
              </div>

              {/* Footer with Auto-Closing Clear Button */}
              {notifications.length > 0 && (
                <div
                  style={{
                    padding: '8px 14px',
                    borderTop: '1px solid var(--glass-border)',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <button
                    onClick={handleClearAllNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      padding: '4px 8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Pill / Button */}
        <div
          onClick={() => {
            soundFx.playClick();
            setActiveTab('settings');
          }}
          title={`${userProfile?.firstName || 'User'} ${userProfile?.lastName || ''} - Go to Settings`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px 4px 4px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--cyan-subtle)';
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)',
              flexShrink: 0,
            }}
          >
            {userProfile?.photo ? (
              <img
                src={userProfile.photo}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#030712' }}>
                {(userProfile?.firstName || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userProfile?.firstName || 'User'}
            </span>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
              Pro Vault
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
