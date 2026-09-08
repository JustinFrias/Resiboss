import {
  LiquidBackground3D,
  PipedreamAuthCard,
  ResibossLogo,
} from '../components';
import { useApp } from '../context/AppContext';
import { ArrowLeft } from 'lucide-react';

export const AuthView = () => {
  const { setUserProfile, soundFx, language } = useApp();
  const isFil = language === 'fil';

  const handleContinueAsGuest = () => {
    soundFx?.playClick?.();
    const guestProfile = {
      id: 'guest_user_account',
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

      {/* Top Floating Back Button */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '16px',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleContinueAsGuest}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#00f2fe',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
        >
          <ArrowLeft size={16} />
          <span>{isFil ? 'Bumalik sa App' : 'Back to App'}</span>
        </button>
      </div>

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

      {/* Back / Guest Access Link */}
      <div style={{ marginTop: '20px', zIndex: 10, textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleContinueAsGuest}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#00f2fe';
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <ArrowLeft size={14} />
          <span>
            {isFil
              ? 'Bumalik sa App (Magpatuloy bilang Guest / Offline)'
              : 'Back to App (Continue as Guest / Offline)'}
          </span>
        </button>
      </div>
    </div>
  );
};
