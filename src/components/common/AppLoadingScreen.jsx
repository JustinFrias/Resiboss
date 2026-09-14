import React from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LiquidBackground3D } from '../canvas/LiquidBackground3D';

export const AppLoadingScreen = () => {
  const { theme } = useApp?.() || { theme: 'dark' };
  const isLight = theme === 'light';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isLight ? '#f8fafc' : '#000000',
        color: isLight ? '#0f172a' : '#f8fafc',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      <LiquidBackground3D />

      <div
        className="glass-panel"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '36px 32px',
          borderRadius: '28px',
          background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 10, 10, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: isLight
            ? '0 20px 40px rgba(0, 0, 0, 0.08)'
            : '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.15)',
          maxWidth: '320px',
          width: '90%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 242, 254, 0.12)',
            border: isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.25)',
          }}
        >
          <img
            src="/resiboss-emblem.png"
            alt="Resiboss"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          RESIBOSS
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.84rem',
            color: isLight ? '#64748b' : '#94a3b8',
            marginTop: '12px',
          }}
        >
          <Loader2
            size={16}
            className="animate-spin"
            style={{ color: '#00f2fe', animation: 'spin 1s linear infinite' }}
          />
          <span>Connecting workspace...</span>
        </div>
      </div>
    </div>
  );
};
