import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const ResibossAuthCard = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    soundFx,
    setIsTermsOpen,
    isTermsAccepted,
    setIsTermsAccepted,
    setIsPrivacyOpen,
    language,
  } = useApp();

  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isFil = language === 'fil';

  // Auto-reset loading if app comes back to foreground, browser finishes, or user returns/navigates back
  useEffect(() => {
    const resetLoading = () => {
      setIsLoading(false);
    };

    window.addEventListener('pageshow', resetLoading);
    window.addEventListener('popstate', resetLoading);
    window.addEventListener('focus', resetLoading);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetLoading();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let browserSub = null;
    let appStateSub = null;
    let backSub = null;
    let resumeSub = null;

    try {
      if (Capacitor.isPluginAvailable('Browser')) {
        browserSub = Browser.addListener('browserFinished', resetLoading);
      }
    } catch (e) {}

    try {
      appStateSub = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) resetLoading();
      });
      backSub = App.addListener('backButton', resetLoading);
      resumeSub = App.addListener('resume', resetLoading);
    } catch (e) {}

    return () => {
      window.removeEventListener('pageshow', resetLoading);
      window.removeEventListener('popstate', resetLoading);
      window.removeEventListener('focus', resetLoading);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      browserSub?.then?.((h) => h.remove?.());
      appStateSub?.then?.((h) => h.remove?.());
      backSub?.then?.((h) => h.remove?.());
      resumeSub?.then?.((h) => h.remove?.());
    };
  }, []);

  // Google OAuth flow
  const handleGoogleAuth = async () => {
    if (isLoading) {
      soundFx?.playClick?.();
      setIsLoading(false);
      return;
    }

    if (!isTermsAccepted) {
      setIsTermsAccepted?.(true);
      try {
        localStorage.setItem('resiboss_terms_accepted_v1', 'true');
      } catch (e) {}
    }

    setErrorMsg(null);
    setSuccessMsg(null);
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

  // Email/Password Submit flow (Sign In or Register)
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg(isFil ? 'Pakilagay ang iyong email address.' : 'Please enter your email address.');
      soundFx?.playClick?.();
      return;
    }
    if (!password) {
      setErrorMsg(isFil ? 'Pakilagay ang iyong password.' : 'Please enter your password.');
      soundFx?.playClick?.();
      return;
    }

    if (!isTermsAccepted) {
      setIsTermsAccepted?.(true);
      try {
        localStorage.setItem('resiboss_terms_accepted_v1', 'true');
      } catch (err) {}
    }

    setIsLoading(true);
    soundFx?.playClick?.();

    try {
      if (mode === 'signin') {
        if (signInWithEmail) {
          await signInWithEmail(email, password);
          soundFx?.playSuccessChime?.();
        }
      } else {
        if (signUpWithEmail) {
          const res = await signUpWithEmail(email, password);
          soundFx?.playSuccessChime?.();
          if (res?.user && !res?.session) {
            setSuccessMsg(
              isFil
                ? 'Nagawa na ang account! Pakitingnan ang iyong email para sa confirmation link bago mag-sign in.'
                : 'Account created! Please check your email for the confirmation link to sign in.'
            );
            setMode('signin');
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Email auth error:', err);
      setErrorMsg(err.message || 'May naganap na error. Pakisubukang muli.');
      setIsLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg(
        isFil
          ? 'Pakilagay muna ang iyong email sa field sa ibaba bago pindutin ang Forgot Password.'
          : 'Please enter your email in the field below first, then tap Forgot Password.'
      );
      soundFx?.playClick?.();
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    soundFx?.playClick?.();

    try {
      if (resetPasswordForEmail) {
        await resetPasswordForEmail(email.trim());
        setSuccessMsg(
          isFil
            ? 'Naipadala na ang password reset instructions sa iyong email!'
            : 'Password reset link sent to your email address!'
        );
      }
    } catch (err) {
      setErrorMsg(err.message || 'Hindi maipadala ang reset link. Pakisubukang muli.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '38px',
        padding: '42px 32px 36px 32px',
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.08), 0 6px 20px rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        textAlign: 'center',
        position: 'relative',
        color: '#1a2219',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* 1. App Squircle Icon Badge */}
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '22px',
          background: '#e9eee7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <img
          src="/resiboss-emblem.png"
          alt="Resiboss"
          style={{
            width: '42px',
            height: '42px',
            objectFit: 'contain',
            display: 'block',
          }}
          onError={(e) => {
            // Fallback SVG in case image file is missing
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* 2. Editorial Serif Title */}
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: '#1a2219',
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {mode === 'signin' ? 'Sign in to Resiboss' : 'Create your account'}
      </h1>

      {/* 3. Subtitle */}
      <p
        style={{
          fontSize: '0.88rem',
          color: '#697268',
          margin: '0 0 24px 0',
          lineHeight: 1.45,
          fontWeight: 450,
        }}
      >
        Sync contracts, signatures, and forms across your devices.
      </p>

      {/* 4. Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        style={{
          width: '100%',
          padding: '13px 20px',
          borderRadius: '999px',
          background: '#ffffff',
          border: '1.5px solid #e4e0d7',
          color: '#222822',
          fontSize: '0.94rem',
          fontWeight: 650,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.18s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#faf9f6';
          e.currentTarget.style.borderColor = '#d6d2c8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#e4e0d7';
        }}
      >
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
      </button>

      {/* 5. Divider "OR WITH EMAIL" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '22px 0 18px 0',
          width: '100%',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: '#ebe7de' }} />
        <span
          style={{
            padding: '0 12px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#899088',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          OR WITH EMAIL
        </span>
        <div style={{ flex: 1, height: '1px', background: '#ebe7de' }} />
      </div>

      {/* 6. Sign In / Register Segmented Tab Switcher */}
      <div
        style={{
          display: 'flex',
          background: '#eeece5',
          borderRadius: '999px',
          padding: '4px',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            soundFx?.playClick?.();
            setMode('signin');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'signin' ? '#536851' : 'transparent',
            color: mode === 'signin' ? '#ffffff' : '#697168',
            fontSize: '0.88rem',
            fontWeight: mode === 'signin' ? 700 : 600,
            transition: 'all 0.18s ease',
            outline: 'none',
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            soundFx?.playClick?.();
            setMode('register');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'register' ? '#536851' : 'transparent',
            color: mode === 'register' ? '#ffffff' : '#697168',
            fontSize: '0.88rem',
            fontWeight: mode === 'register' ? 700 : 600,
            transition: 'all 0.18s ease',
            outline: 'none',
          }}
        >
          Register
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '14px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            fontSize: '0.82rem',
            marginBottom: '16px',
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

      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '14px',
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 7. Form Fields */}
      <form onSubmit={handleSubmit} style={{ width: '100%', textAlign: 'left' }}>
        {/* Email Address */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="resiboss-auth-email"
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#424841',
              marginBottom: '6px',
            }}
          >
            Email Address
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1.5px solid #e4e0d7',
              borderRadius: '999px',
              padding: '11px 18px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#536851';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(83, 104, 81, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e4e0d7';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Mail size={18} color="#949a93" style={{ flexShrink: 0 }} />
            <input
              id="resiboss-auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoComplete="email"
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.92rem',
                color: '#1a2219',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label
              htmlFor="resiboss-auth-password"
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#424841',
              }}
            >
              Password
            </label>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#536851',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1.5px solid #e4e0d7',
              borderRadius: '999px',
              padding: '11px 18px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#536851';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(83, 104, 81, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e4e0d7';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Lock size={18} color="#949a93" style={{ flexShrink: 0 }} />
            <input
              id="resiboss-auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.92rem',
                color: '#1a2219',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* 8. Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '999px',
            background: '#536851',
            border: 'none',
            color: '#ffffff',
            fontSize: '0.96rem',
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(83, 104, 81, 0.3)',
            transition: 'all 0.18s ease',
            outline: 'none',
            marginBottom: '18px',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.background = '#475a45';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.background = '#536851';
          }}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>{mode === 'signin' ? 'Sign In' : 'Register'}</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* 9. Footer Terms & Privacy Disclaimer */}
      <p
        style={{
          fontSize: '0.72rem',
          color: '#889088',
          margin: 0,
          lineHeight: 1.5,
          fontWeight: 450,
        }}
      >
        By continuing, you agree to Resiboss's{' '}
        <span
          onClick={() => setIsPrivacyOpen?.(true)}
          style={{ textDecoration: 'underline', cursor: 'pointer', color: '#536851' }}
        >
          local-first privacy policy
        </span>
        . Signatures and PDFs stay securely stored on your devices.
      </p>
    </div>
  );
};
