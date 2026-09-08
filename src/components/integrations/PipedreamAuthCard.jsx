import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const PipedreamAuthCard = () => {
  const { signInWithGoogle, soundFx, setIsTermsOpen } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    soundFx?.playClick?.();
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error('Google Auth error:', err);
      setErrorMsg(err.message || 'Nabigo ang Google Sign-In. Pakisubukang muli.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '36px 28px',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow, 0 16px 48px rgba(0, 0, 0, 0.6))',
        position: 'relative',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      {/* Security Icon Badge */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.18), rgba(168, 85, 247, 0.18))',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00f2fe',
          boxShadow: '0 0 24px rgba(0, 242, 254, 0.25)',
          marginBottom: '16px',
        }}
      >
        <ShieldCheck size={32} />
      </div>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
          letterSpacing: '-0.01em',
        }}
      >
        Sign In to Resiboss
      </h2>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          margin: '0 0 28px 0',
          lineHeight: 1.45,
        }}
      >
        Access your receipt vault, analytics, and automated expense intelligence.
      </p>

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.84rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Action: Continue with Google Button */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: '14px',
          background: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          color: '#1f2937',
          fontSize: '0.96rem',
          fontWeight: 700,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 20px rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.4), 0 0 25px rgba(255, 255, 255, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 20px rgba(255, 255, 255, 0.2)';
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" color="#1f2937" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Security & Privacy Badge */}
      <div
        style={{
          marginTop: '22px',
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>🔒 Secure 256-bit OAuth authentication</span>
      </div>

      {/* Terms & Conditions Agreement Link */}
      <div style={{ marginTop: '12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
        By continuing, you agree to our{' '}
        <button
          type="button"
          onClick={() => {
            soundFx?.playClick?.();
            setIsTermsOpen(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#00f2fe',
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.74rem',
            fontWeight: 600,
            textDecoration: 'underline',
            outline: 'none',
          }}
        >
          Terms & Conditions
        </button>
      </div>
    </div>
  );
};
