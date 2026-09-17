import React, { useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UpdateAvailableBanner = () => {
  const { hasNewVersion, applyAppUpdate, remoteVersionInfo } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!hasNewVersion || isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998,
        width: 'calc(100% - 24px)',
        maxWidth: '480px',
        animation: 'slideDownFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 58, 138, 0.92))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 242, 254, 0.45)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 242, 254, 0.25)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              flexShrink: 0,
              boxShadow: '0 0 14px rgba(0, 242, 254, 0.5)',
            }}
          >
            <Sparkles size={18} strokeWidth={2.2} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>May Bagong Update!</span>
              <span
                style={{
                  fontSize: '0.64rem',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: 'rgba(0, 242, 254, 0.2)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: '#00f2fe',
                }}
              >
                v{remoteVersionInfo?.version || '1.2.0'}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'rgba(255, 255, 255, 0.75)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Na-update ang app sa cloud. I-tap para ma-apply.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={applyAppUpdate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
              border: 'none',
              color: '#000000',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0, 242, 254, 0.4)',
              transition: 'transform 0.15s ease, filter 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <RefreshCw size={13} strokeWidth={2.4} />
            <span>I-refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
