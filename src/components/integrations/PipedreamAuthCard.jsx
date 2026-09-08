import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const PipedreamAuthCard = () => {
  const {
    signInWithGoogle,
    soundFx,
    setIsTermsOpen,
    isTermsAccepted,
    setIsTermsAccepted,
    setIsPrivacyOpen,
    language,
  } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isFil = language === 'fil';

  // Auto-reset loading if app comes back to foreground, browser finishes, or user returns/navigates back
  useEffect(() => {
    const resetLoading = () => {
      setIsLoading(false);
    };

    // Web & mobile browser events
    window.addEventListener('pageshow', resetLoading);
    window.addEventListener('popstate', resetLoading);
    window.addEventListener('focus', resetLoading);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetLoading();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Capacitor Native Android / iOS events
    let browserSub = null;
    let appStateSub = null;
    let backSub = null;
    let resumeSub = null;

    try {
      if (Capacitor.isPluginAvailable('Browser')) {
        browserSub = Browser.addListener('browserFinished', () => {
          resetLoading();
        });
      }
    } catch (e) {}

    try {
      appStateSub = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          resetLoading();
        }
      });
      backSub = App.addListener('backButton', () => {
        resetLoading();
      });
      resumeSub = App.addListener('resume', () => {
        resetLoading();
      });
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

  // Auto-release loading after 2.5 seconds max so user is NEVER permanently stuck
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleGoogleAuth = async () => {
    // If user clicked while it was in loading state, immediately cancel/reset it!
    if (isLoading) {
      soundFx?.playClick?.();
      setIsLoading(false);
      return;
    }

    // Check if user has read and accepted the Terms and Conditions
    if (!isTermsAccepted) {
      soundFx?.playClick?.();
      setErrorMsg(
        isFil
          ? 'Kailangang basahin at tanggapin muna ang Terms and Conditions bago mag-sign in gamit ang Google.'
          : 'Please read and accept the Terms & Conditions before continuing with Google.'
      );
      // Automatically pop up the Terms Modal so they can review and accept
      setIsTermsOpen(true);
      return;
    }

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
          background: 'linear-gradient(180deg, rgba(32, 248, 161, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(32, 248, 161, 0.45)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#20f8a1',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4), inset 0 1.5px 0.5px rgba(255, 255, 255, 0.4), inset 0 -1.5px 0.5px rgba(0, 0, 0, 0.35)',
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

      {/* Terms & Conditions Agreement Checkbox */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: isTermsAccepted
            ? 'rgba(0, 242, 254, 0.08)'
            : 'rgba(255, 255, 255, 0.03)',
          border: isTermsAccepted
            ? '1px solid rgba(0, 242, 254, 0.35)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '18px',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onClick={() => {
          const nextVal = !isTermsAccepted;
          setIsTermsAccepted?.(nextVal);
          try {
            if (nextVal) {
              localStorage.setItem('resiboss_terms_accepted_v1', 'true');
              soundFx?.playSuccessChime?.();
              if (errorMsg) setErrorMsg(null);
            } else {
              localStorage.removeItem('resiboss_terms_accepted_v1');
              soundFx?.playClick?.();
            }
          } catch (e) {}
        }}
      >
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: isTermsAccepted
              ? '2px solid #00f2fe'
              : '2px solid rgba(255, 255, 255, 0.35)',
            background: isTermsAccepted ? '#00f2fe' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.18s ease',
            boxShadow: isTermsAccepted ? '0 0 10px rgba(0, 242, 254, 0.4)' : 'none',
          }}
        >
          {isTermsAccepted && (
            <CheckCircle2 size={16} color="#050b14" strokeWidth={3} />
          )}
        </div>
        <div style={{ fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
          {isFil ? (
            <>
              Nabasa at sumasang-ayon ako sa{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx?.playClick?.();
                  setIsTermsOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f2fe',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  outline: 'none',
                }}
              >
                Terms and Conditions
              </button>{' '}
              at{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx?.playClick?.();
                  setIsPrivacyOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f2fe',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  outline: 'none',
                }}
              >
                Privacy Policy
              </button>
            </>
          ) : (
            <>
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx?.playClick?.();
                  setIsTermsOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f2fe',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  outline: 'none',
                }}
              >
                Terms & Conditions
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx?.playClick?.();
                  setIsPrivacyOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f2fe',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  outline: 'none',
                }}
              >
                Privacy Policy
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Action: Continue with Google Button */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        title={
          isLoading
            ? (isFil ? 'Pindutin para kanselahin' : 'Tap to cancel')
            : (!isTermsAccepted
                ? (isFil
                    ? 'Kailangang basahin at tanggapin muna ang Terms and Conditions'
                    : 'Please read and accept the Terms & Conditions before continuing')
                : '')
        }
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 48%, #f3f4f6 52%, #e5e7eb 100%)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          color: '#111827',
          fontSize: '0.96rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: isTermsAccepted
            ? '0 6px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1.5px 0.5px rgba(255, 255, 255, 1), inset 0 -2px 1px rgba(0, 0, 0, 0.12)'
            : '0 4px 14px rgba(0, 0, 0, 0.3), inset 0 1.5px 0.5px rgba(255, 255, 255, 0.8)',
          opacity: isTermsAccepted ? 1 : 0.78,
          filter: isTermsAccepted ? 'none' : 'grayscale(0.2)',
          transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease, opacity 0.2s ease, filter 0.2s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1.5px)';
          e.currentTarget.style.boxShadow = isTermsAccepted
            ? '0 10px 26px rgba(0, 0, 0, 0.45), 0 2px 5px rgba(0, 0, 0, 0.2), inset 0 1.5px 0.5px rgba(255, 255, 255, 1), inset 0 -2px 1px rgba(0, 0, 0, 0.12)'
            : '0 6px 18px rgba(0, 0, 0, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isTermsAccepted
            ? '0 6px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1.5px 0.5px rgba(255, 255, 255, 1), inset 0 -2px 1px rgba(0, 0, 0, 0.12)'
            : '0 4px 14px rgba(0, 0, 0, 0.3)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(2px)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -1px 0 rgba(255, 255, 255, 0.5)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1.5px)';
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={19} className="animate-spin" color="#1f2937" />
            <span>Connecting to Google...</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                opacity: 0.65,
                marginLeft: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.07)',
              }}
            >
              {isFil ? 'Kanselahin' : 'Cancel'}
            </span>
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

      {/* Dedicated Back / Cancel Button */}
      {isLoading && (
        <button
          type="button"
          onClick={() => {
            soundFx?.playClick?.();
            setIsLoading(false);
          }}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '11px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            color: '#00f2fe',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <ArrowLeft size={16} />
          <span>{isFil ? 'Bumalik sa Resiboss (Kanselahin)' : 'Back to Resiboss (Cancel)'}</span>
        </button>
      )}

      {/* Security and Privacy Assurance Note */}
      <div
        style={{
          marginTop: '16px',
          fontSize: '0.74rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          opacity: 0.85,
        }}
      >
        <ShieldCheck size={14} color="#00f2fe" />
        <span>
          {isFil
            ? 'Protektado at pribado ang data sa iyong sariling account'
            : 'Encrypted & strictly private to your own account'}
        </span>
      </div>
    </div>
  );
};
