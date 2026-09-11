import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { validateEmailAddress } from '../../utils/emailValidator';

export const ResibossAuthCard = ({ initialMode = 'signin' }) => {
  const {
    theme,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    resendConfirmationEmail,
    soundFx,
    setIsTermsOpen,
    isTermsAccepted,
    setIsTermsAccepted,
    setIsPrivacyOpen,
    language,
  } = useApp();

  const isLight = theme === 'light';

  const [mode, setMode] = useState(initialMode); // 'signin' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [hasCreatedAccount, setHasCreatedAccount] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [suggestedEmail, setSuggestedEmail] = useState(null);

  const isGoogleDisabled = isLoading;

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

  // Handle email confirmed redirect: force Sign In tab so user manually types email and password
  useEffect(() => {
    try {
      const confirmedEmail = localStorage.getItem('resiboss_email_just_confirmed');
      if (confirmedEmail !== null) {
        setMode('signin');
        setEmail('');
        setPassword('');
        setSuccessMsg(
          isFil
            ? 'Matagumpay nang nakumpirma ang iyong email! Pakilagay ang iyong email at password para mag-sign in.'
            : 'Email successfully confirmed! Please enter your email and password to sign in.'
        );
        setErrorMsg(null);
        localStorage.removeItem('resiboss_email_just_confirmed');
        soundFx?.playSuccessChime?.();
      }
    } catch (e) {}
  }, [isFil]);

  // Google OAuth flow
  const handleGoogleAuth = async () => {
    if (isLoading) {
      soundFx?.playClick?.();
      setIsLoading(false);
      return;
    }

    // Mark account as created and terms as accepted
    try {
      localStorage.setItem('resiboss_account_created_v1', 'true');
      localStorage.setItem('resiboss_terms_accepted_v1', 'true');
    } catch (e) {}
    setHasCreatedAccount(true);
    setIsTermsAccepted?.(true);

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
    setSuggestedEmail(null);

    const emailCheck = validateEmailAddress(email, language);
    if (!emailCheck.isValid) {
      setErrorMsg(emailCheck.error);
      if (emailCheck.suggestion) {
        setSuggestedEmail(emailCheck.suggestion);
      }
      soundFx?.playClick?.();
      return;
    }

    if (!password) {
      setErrorMsg(isFil ? 'Pakilagay ang iyong password.' : 'Please enter your password.');
      soundFx?.playClick?.();
      return;
    }

    if (mode === 'register' && !isAgreed) {
      setErrorMsg(
        isFil
          ? 'Pakisuyong i-check ang kahon upang tanggapin ang Terms & Conditions bago magpatuloy.'
          : 'Please check the box to agree to the Terms & Conditions before continuing.'
      );
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
          const res = await signUpWithEmail(email, password, fullName);
          soundFx?.playSuccessChime?.();
          try {
            localStorage.setItem('resiboss_account_created_v1', 'true');
          } catch (e) {}
          setHasCreatedAccount(true);

          if (res?.user && !res?.session) {
            setSuccessMsg(
              isFil
                ? 'Napadala na ang confirmation link sa iyong email! Paki-click muna ang link sa iyong Gmail inbox bago mag-sign in dito.'
                : 'Confirmation link sent to your email! Please click the verification link in your inbox before signing in.'
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

  // Resend verification email handler
  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setErrorMsg(
        isFil
          ? 'Pakilagay muna ang iyong email sa field sa ibaba bago mag-resend.'
          : 'Please enter your email in the field below first, then tap Resend.'
      );
      soundFx?.playClick?.();
      return;
    }

    setIsResending(true);
    soundFx?.playClick?.();
    try {
      if (resendConfirmationEmail) {
        await resendConfirmationEmail(email.trim());
        setSuccessMsg(
          isFil
            ? 'Naipadala na muli ang confirmation link sa iyong Gmail inbox! Pakisuri ang iyong email.'
            : 'Verification link resent to your email! Please check your inbox.'
        );
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Hindi maipadala ang verification link. Pakisubukang muli.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="glass-panel auth-card"
      style={{
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(13, 18, 32, 0.88)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        borderRadius: '32px',
        padding: '38px 28px 30px 28px',
        boxShadow: isLight
          ? '0 20px 50px rgba(15, 23, 42, 0.08), 0 0 25px rgba(2, 132, 199, 0.08)'
          : '0 25px 65px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.12)',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(0, 242, 254, 0.28)',
        boxSizing: 'border-box',
        textAlign: 'center',
        position: 'relative',
        color: isLight ? '#0f172a' : '#f8fafc',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* 1. App Squircle Icon Badge with Cyan Glow */}
      <div
        style={{
          width: '66px',
          height: '66px',
          borderRadius: '20px',
          background: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(0, 242, 254, 0.12)',
          border: isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(0, 242, 254, 0.38)',
          boxShadow: isLight
            ? '0 0 20px rgba(2, 132, 199, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
            : '0 0 25px rgba(0, 242, 254, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px auto',
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
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* 2. Cyberpunk Liquid Gradient Title */}
      <h1
        className="auth-title-gradient"
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          fontSize: '1.9rem',
          fontWeight: 800,
          background: isLight
            ? 'linear-gradient(135deg, #0f172a 35%, #0284c7 100%)'
            : 'linear-gradient(135deg, #ffffff 40%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {mode === 'signin' ? 'Sign in to Resiboss' : 'Create your account'}
      </h1>

      {/* 3. Subtitle */}
      <p
        style={{
          fontSize: '0.85rem',
          color: isLight ? '#475569' : '#94a3b8',
          margin: '0 0 22px 0',
          lineHeight: 1.45,
          fontWeight: 450,
        }}
      >
        Sync contracts, signatures, and forms across your devices.
      </p>

      {/* 4. Google OAuth Button */}
      <div style={{ width: '100%', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isGoogleDisabled}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '999px',
            background: isGoogleDisabled
              ? (isLight ? 'rgba(241, 245, 249, 0.7)' : 'rgba(10, 16, 34, 0.45)')
              : (isLight ? '#ffffff' : 'rgba(10, 16, 34, 0.85)'),
            border: isGoogleDisabled
              ? (isLight ? '1.5px dashed rgba(15, 23, 42, 0.15)' : '1.5px dashed rgba(255, 255, 255, 0.12)')
              : (isLight ? '1.5px solid rgba(15, 23, 42, 0.16)' : '1.5px solid rgba(255, 255, 255, 0.18)'),
            color: isGoogleDisabled
              ? '#94a3b8'
              : (isLight ? '#0f172a' : '#ffffff'),
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: '0.94rem',
            fontWeight: 700,
            cursor: isGoogleDisabled ? 'not-allowed' : 'pointer',
            opacity: isGoogleDisabled ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: isGoogleDisabled
              ? 'none'
              : (isLight ? '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)' : '0 4px 16px rgba(0, 0, 0, 0.4)'),
            transition: 'all 0.18s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!isGoogleDisabled) {
              e.currentTarget.style.background = isLight ? '#f8fafc' : 'rgba(26, 36, 62, 0.95)';
              e.currentTarget.style.borderColor = isLight ? '#0284c7' : '#00f2fe';
              e.currentTarget.style.boxShadow = isLight ? '0 4px 16px rgba(2, 132, 199, 0.18)' : '0 0 20px rgba(0, 242, 254, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGoogleDisabled) {
              e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(10, 16, 34, 0.85)';
              e.currentTarget.style.borderColor = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(15, 23, 42, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.4)';
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ opacity: isGoogleDisabled ? 0.4 : 1, flexShrink: 0 }}>
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
          <span style={{ color: isGoogleDisabled ? '#94a3b8' : (isLight ? '#0f172a' : '#ffffff') }}>
            Continue with Google
          </span>
        </button>
      </div>

      {/* 5. Divider "OR WITH EMAIL" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0 18px 0',
          width: '100%',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)' }} />
        <span
          style={{
            padding: '0 12px',
            fontSize: '0.68rem',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: isLight ? '#64748b' : '#64748b',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          OR WITH EMAIL
        </span>
        <div style={{ flex: 1, height: '1px', background: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)' }} />
      </div>

      {/* 6. Sign In / Register Segmented Tab Switcher */}
      <div
        style={{
          display: 'flex',
          background: isLight ? '#f1f5f9' : 'rgba(10, 16, 34, 0.75)',
          border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
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
            setEmail('');
            setPassword('');
            setFullName('');
            setErrorMsg(null);
            setSuccessMsg(null);
            setSuggestedEmail(null);
          }}
          className={mode === 'signin' ? 'keep-white' : ''}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'signin' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
            color: mode === 'signin' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            fontSize: '0.88rem',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: mode === 'signin' ? 700 : 600,
            boxShadow: mode === 'signin' ? '0 2px 14px rgba(37, 99, 235, 0.45), 0 0 15px rgba(0, 242, 254, 0.2)' : 'none',
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
            setEmail('');
            setPassword('');
            setFullName('');
            setIsAgreed(false);
            setErrorMsg(null);
            setSuccessMsg(null);
            setSuggestedEmail(null);
          }}
          className={mode === 'register' ? 'keep-white' : ''}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'register' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
            color: mode === 'register' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            fontSize: '0.88rem',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: mode === 'register' ? 700 : 600,
            boxShadow: mode === 'register' ? '0 2px 14px rgba(37, 99, 235, 0.45), 0 0 15px rgba(0, 242, 254, 0.2)' : 'none',
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
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
          {(errorMsg.toLowerCase().includes('confirm') || errorMsg.toLowerCase().includes('kumpirma')) && (
            <div style={{ paddingLeft: '24px' }}>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResending}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  cursor: isResending ? 'not-allowed' : 'pointer',
                  outline: 'none',
                }}
              >
                {isResending
                  ? (isFil ? 'Ipinapadala...' : 'Resending...')
                  : (isFil ? '📩 I-resend ang confirmation link' : '📩 Resend verification email')}
              </button>
            </div>
          )}
          {suggestedEmail && (
            <div style={{ paddingLeft: '24px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail(suggestedEmail);
                  setSuggestedEmail(null);
                  setErrorMsg(null);
                  soundFx?.playClick?.();
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={13} />
                <span>{isFil ? `Itama: Gamitin ang "${suggestedEmail}"` : `Fix: Use "${suggestedEmail}"`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
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
        {/* Full Name (Optional) - Shown when registering */}
        {mode === 'register' && (
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="resiboss-auth-fullname"
              style={{
                display: 'block',
                fontSize: '0.84rem',
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                color: isLight ? '#334155' : '#cbd5e1',
                marginBottom: '6px',
              }}
            >
              Full Name{' '}
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: '0.74rem',
                  color: isLight ? '#64748b' : '#64748b',
                }}
              >
                (Optional)
              </span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isLight ? '#f8fafc' : 'rgba(10, 16, 34, 0.7)',
                border: isLight ? '1.5px solid rgba(15, 23, 42, 0.16)' : '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                padding: '11px 18px',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = isLight ? '#0284c7' : '#00f2fe';
                e.currentTarget.style.boxShadow = isLight
                  ? '0 0 0 3px rgba(2, 132, 199, 0.15)'
                  : '0 0 0 3px rgba(0, 242, 254, 0.18), 0 0 15px rgba(0, 242, 254, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <User size={18} color={isLight ? '#0284c7' : '#38bdf8'} style={{ flexShrink: 0 }} />
              <input
                id="resiboss-auth-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.92rem',
                  color: isLight ? '#0f172a' : '#ffffff',
                  background: 'transparent',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
            </div>
          </div>
        )}

        {/* Email Address */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="resiboss-auth-email"
            style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              color: isLight ? '#334155' : '#cbd5e1',
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
              background: isLight ? '#f8fafc' : 'rgba(10, 16, 34, 0.7)',
              border: isLight ? '1.5px solid rgba(15, 23, 42, 0.16)' : '1.5px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '11px 18px',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = isLight ? '#0284c7' : '#00f2fe';
              e.currentTarget.style.boxShadow = isLight
                ? '0 0 0 3px rgba(2, 132, 199, 0.15)'
                : '0 0 0 3px rgba(0, 242, 254, 0.18), 0 0 15px rgba(0, 242, 254, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Mail size={18} color={isLight ? '#0284c7' : '#38bdf8'} style={{ flexShrink: 0 }} />
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
                color: isLight ? '#0f172a' : '#ffffff',
                background: 'transparent',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: mode === 'register' ? '18px' : '22px' }}>
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
                fontSize: '0.84rem',
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                color: isLight ? '#334155' : '#cbd5e1',
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
                  color: isLight ? '#0284c7' : '#38bdf8',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
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
              background: isLight ? '#f8fafc' : 'rgba(10, 16, 34, 0.7)',
              border: isLight ? '1.5px solid rgba(15, 23, 42, 0.16)' : '1.5px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '11px 18px',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = isLight ? '#0284c7' : '#00f2fe';
              e.currentTarget.style.boxShadow = isLight
                ? '0 0 0 3px rgba(2, 132, 199, 0.15)'
                : '0 0 0 3px rgba(0, 242, 254, 0.18), 0 0 15px rgba(0, 242, 254, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Lock size={18} color={isLight ? '#0284c7' : '#38bdf8'} style={{ flexShrink: 0 }} />
            <input
              id="resiboss-auth-password"
              type={showPassword ? 'text' : 'password'}
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
                color: isLight ? '#0f172a' : '#ffffff',
                background: 'transparent',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            <button
              type="button"
              onClick={() => {
                soundFx?.playClick?.();
                setShowPassword((prev) => !prev);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                padding: '6px',
                margin: '-4px -6px -4px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showPassword ? (isLight ? '#0284c7' : '#00f2fe') : (isLight ? '#64748b' : '#94a3b8'),
                transition: 'all 0.18s ease',
                flexShrink: 0,
                borderRadius: '50%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isLight ? '#0284c7' : '#38bdf8';
                e.currentTarget.style.background = isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = showPassword ? (isLight ? '#0284c7' : '#00f2fe') : (isLight ? '#64748b' : '#94a3b8');
                e.currentTarget.style.background = 'transparent';
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {mode === 'register' && (
            <div
              style={{
                fontSize: '0.74rem',
                color: isLight ? '#64748b' : '#64748b',
                marginTop: '6px',
                paddingLeft: '4px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Must be at least 6 characters.
            </div>
          )}
        </div>

        {/* Terms & Conditions Checkbox (For first-timers registering only) */}
        {mode === 'register' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
              textAlign: 'left',
              padding: '0 4px',
            }}
          >
            <input
              type="checkbox"
              id="resiboss-terms-checkbox"
              checked={isAgreed}
              onChange={(e) => {
                soundFx?.playClick?.();
                setIsAgreed(e.target.checked);
              }}
              style={{
                marginTop: '3px',
                accentColor: '#0284c7',
                width: '17px',
                height: '17px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <label
              htmlFor="resiboss-terms-checkbox"
              style={{
                fontSize: '0.8rem',
                color: isLight ? '#475569' : '#94a3b8',
                lineHeight: 1.45,
                cursor: 'pointer',
                userSelect: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              I agree to the{' '}
              <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 600 }}>
                terms & conditions
              </span>{' '}
              and{' '}
              <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 600 }}>
                privacy policy
              </span>{' '}
              provided by the company.
            </label>
          </div>
        )}

        {/* 8. Submit Button with Neon Cyan / Electric Blue Gradient */}
        <button
          type="submit"
          disabled={isLoading || (mode === 'register' && !isAgreed)}
          className="keep-white liquid-btn-primary"
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '999px',
            background: mode === 'register' && !isAgreed
              ? (isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(37, 99, 235, 0.3)')
              : 'linear-gradient(135deg, #0284c7, #2563eb)',
            border: 'none',
            color: mode === 'register' && !isAgreed ? '#94a3b8' : '#ffffff',
            fontSize: '0.96rem',
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            cursor: isLoading || (mode === 'register' && !isAgreed) ? 'not-allowed' : 'pointer',
            opacity: mode === 'register' && !isAgreed ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: mode === 'register' && !isAgreed
              ? 'none'
              : (isLight ? '0 4px 16px rgba(37, 99, 235, 0.35)' : '0 4px 18px rgba(37, 99, 235, 0.45), 0 0 25px rgba(0, 242, 254, 0.25)'),
            transition: 'all 0.2s ease',
            outline: 'none',
            marginBottom: '18px',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !(mode === 'register' && !isAgreed)) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = isLight
                ? '0 6px 20px rgba(37, 99, 235, 0.45)'
                : '0 6px 24px rgba(37, 99, 235, 0.55), 0 0 30px rgba(0, 242, 254, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && !(mode === 'register' && !isAgreed)) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isLight
                ? '0 4px 16px rgba(37, 99, 235, 0.35)'
                : '0 4px 18px rgba(37, 99, 235, 0.45), 0 0 25px rgba(0, 242, 254, 0.25)';
            }
          }}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* 9. Footer Terms & Privacy Disclaimer */}
      <p
        style={{
          fontSize: '0.74rem',
          color: isLight ? '#64748b' : '#64748b',
          margin: 0,
          lineHeight: 1.5,
          fontWeight: 450,
        }}
      >
        By continuing, you agree to Resiboss's{' '}
        <span
          onClick={() => setIsPrivacyOpen?.(true)}
          style={{ textDecoration: 'underline', cursor: 'pointer', color: isLight ? '#0284c7' : '#38bdf8' }}
        >
          local-first privacy policy
        </span>
        . Signatures and PDFs stay securely stored on your devices.
      </p>
    </div>
  );
};
