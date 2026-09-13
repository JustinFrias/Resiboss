import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, AlertTriangle, CheckCircle2, Mail, Info, X } from 'lucide-react';

export const InAppToast = () => {
  const { activeToast, dismissToast, setActiveTab, theme } = useApp();

  if (!activeToast) return null;

  const isLight = theme === 'light';
  const isWarning = activeToast.type === 'warning' || activeToast.type === 'alert' || activeToast.type === 'error';
  const isSuccess = activeToast.type === 'success';
  const isEmail = activeToast.type === 'email' || activeToast.title?.toLowerCase().includes('email');

  const getIcon = () => {
    if (isWarning) return <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />;
    if (isEmail) return <Mail size={20} color="#00f2fe" style={{ flexShrink: 0 }} />;
    if (isSuccess) return <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />;
    return <Bell size={20} color={isLight ? '#1e3a8a' : '#00f2fe'} style={{ flexShrink: 0 }} />;
  };

  const borderColor = isWarning
    ? 'rgba(245, 158, 11, 0.45)'
    : isSuccess
    ? 'rgba(16, 185, 129, 0.45)'
    : isLight
    ? 'rgba(30, 58, 138, 0.25)'
    : 'rgba(0, 242, 254, 0.35)';

  const accentColor = isWarning
    ? '#f59e0b'
    : isSuccess
    ? '#10b981'
    : isLight
    ? '#1e3a8a'
    : '#00f2fe';

  const handleClick = (e) => {
    e.stopPropagation();
    if (activeToast.targetTab && setActiveTab) {
      setActiveTab(activeToast.targetTab);
    }
    dismissToast();
  };

  return (
    <aside
      aria-live="polite"
      aria-label="Application Notification"
      className="in-app-toast-container"
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        maxWidth: '400px',
        width: 'calc(100vw - 40px)',
        background: isLight
          ? 'rgba(255, 255, 255, 0.96)'
          : 'rgba(11, 22, 38, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '16px',
        boxShadow: isWarning
          ? '0 16px 40px rgba(245, 158, 11, 0.22), 0 4px 12px rgba(0,0,0,0.1)'
          : isSuccess
          ? '0 16px 40px rgba(16, 185, 129, 0.22), 0 4px 12px rgba(0,0,0,0.1)'
          : '0 16px 40px rgba(0, 0, 0, 0.35), 0 0 20px rgba(0, 242, 254, 0.15)',
        padding: '14px 16px 16px 16px',
        cursor: 'pointer',
        animation: 'slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isWarning
              ? 'rgba(245, 158, 11, 0.12)'
              : isSuccess
              ? 'rgba(16, 185, 129, 0.12)'
              : isLight
              ? 'rgba(30, 58, 138, 0.08)'
              : 'rgba(0, 242, 254, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getIcon()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: isLight ? '#0f2942' : '#f8fafc',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeToast.title}
            </span>
          </div>

          <div
            style={{
              fontSize: '0.80rem',
              lineHeight: 1.45,
              color: isLight ? '#475569' : '#94a3b8',
              wordBreak: 'break-word',
            }}
          >
            {activeToast.desc || activeToast.message}
          </div>

          {activeToast.targetTab && (
            <div
              style={{
                marginTop: '6px',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: accentColor,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Click to view in {activeToast.targetTab} →
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: isLight ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#0f2942' : '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? '#94a3b8' : '#64748b')}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      {/* Auto-dismiss animated progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            height: '100%',
            background: accentColor,
            animation: 'toastCountdown 4.5s linear forwards',
          }}
        />
      </div>
    </aside>
  );
};
