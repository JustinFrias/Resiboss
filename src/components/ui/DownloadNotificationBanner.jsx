import React, { useState, useEffect } from 'react';
import { addDownloadListener, openDownloadedFile } from '../../utils/fileDownloader';
import { X, ExternalLink, CheckCircle } from 'lucide-react';

export const DownloadNotificationBanner = () => {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    const unsubscribe = addDownloadListener((payload) => {
      setDownloads((prev) => [payload, ...prev.slice(0, 2)]);
    });
    return unsubscribe;
  }, []);

  const handleDismiss = (id) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  const handleOpen = async (item) => {
    await openDownloadedFile(item);
  };

  if (downloads.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100vw - 32px)',
        pointerEvents: 'none',
      }}
    >
      {downloads.map((item) => (
        <div
          key={item.id}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(24, 28, 38, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(0, 242, 254, 0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'resibossSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Excel / Document Green Icon matching user screenshot */}
          <div
            style={{
              width: '32px',
              height: '38px',
              background: 'linear-gradient(135deg, #107c41, #0a5829)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 124, 65, 0.35)',
              position: 'relative',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            {/* Top dog-ear fold */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '8px',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderBottomLeftRadius: '3px',
              }}
            />
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 900,
                fontFamily: 'Segoe UI, sans-serif',
                letterSpacing: '-0.5px',
              }}
            >
              X
            </span>
          </div>

          {/* Details & "Open file" link */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#f8fafc',
                fontFamily: 'var(--font-mono, monospace)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}
              title={item.filename}
            >
              {item.filename}
            </div>

            <button
              onClick={() => handleOpen(item)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0 0 0',
                color: '#38bdf8',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              <span>Open file</span>
              <ExternalLink size={12} style={{ opacity: 0.8 }} />
            </button>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => handleDismiss(item.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              flexShrink: 0,
            }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
