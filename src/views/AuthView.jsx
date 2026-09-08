import React from 'react';
import {
  LiquidBackground3D,
  PipedreamAuthCard,
  ResibossLogo,
} from '../components';
import { useApp } from '../context/AppContext';

export const AuthView = () => {
  const { setUserProfile, soundFx } = useApp();

  const handleContinueAsGuest = () => {
    soundFx?.playClick?.();
    const guestProfile = {
      id: `guest_${Date.now()}`,
      firstName: 'Guest',
      lastName: 'User',
      email: 'guest@resiboss.local',
      isAuthSession: true,
      isGuest: true,
    };
    setUserProfile(guestProfile);
    try {
      sessionStorage.setItem('resiboss_session_profile_v1', JSON.stringify(guestProfile));
      localStorage.removeItem('resiboss_user_profile_v1');
    } catch (e) {}
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 3D Liquid Canvas Background */}
      <LiquidBackground3D />

      {/* Brand Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            marginBottom: '14px',
            filter: 'drop-shadow(0 0 28px rgba(32, 248, 161, 0.5))',
          }}
        >
          <ResibossLogo size={80} showText={false} />
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '0.04em',
            margin: '0 0 6px 0',
            background: 'linear-gradient(135deg, #ffffff 25%, #20f8a1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(32, 248, 161, 0.4)',
          }}
        >
          RESIBOSS
        </h1>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '320px',
            lineHeight: 1.4,
          }}
        >
          Smart Receipt Scanner & Financial Intelligence
        </p>
      </div>

      {/* Main Authentication Card */}
      <div style={{ width: '100%', maxWidth: '420px', zIndex: 10 }}>
        <PipedreamAuthCard />
      </div>

      {/* Subtle Guest Access Link */}
      <div style={{ marginTop: '20px', zIndex: 10, textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleContinueAsGuest}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            padding: '8px 14px',
            borderRadius: '8px',
            transition: 'color 0.2s ease',
            textDecoration: 'underline',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#00f2fe')}
          onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
        >
          Explore as Guest (Offline Mode)
        </button>
      </div>
    </div>
  );
};
