import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cookie,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  X,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';

export const CookieConsentBanner = () => {
  const {
    language,
    soundFx,
    cookieConsent,
    saveCookieConsent,
    setIsPrivacyOpen,
    setIsTermsOpen,
    isCookieModalOpen,
    setIsCookieModalOpen,
    userProfile,
  } = useApp();

  const isFil = language === 'fil';

  // State for customization modal
  const [preferences, setPreferences] = useState(() => ({
    essential: true, // Always true
    functional: cookieConsent?.functional ?? true,
    analytics: cookieConsent?.analytics ?? true,
  }));

  const handleAcceptAll = () => {
    soundFx?.playSuccessChime?.();
    const consent = {
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    saveCookieConsent(consent);
    setIsCookieModalOpen(false);
  };

  const handleEssentialOnly = () => {
    soundFx?.playClick?.();
    const consent = {
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    saveCookieConsent(consent);
    setIsCookieModalOpen(false);
  };

  const handleSavePreferences = () => {
    soundFx?.playSuccessChime?.();
    const consent = {
      essential: true,
      functional: preferences.functional,
      analytics: preferences.analytics,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    saveCookieConsent(consent);
    setIsCookieModalOpen(false);
  };

  return (
    <>
      {/* Floating Bottom Cookie Banner (Only shown on initial Auth/Landing screen when user is not logged in) */}
      {!cookieConsent && !userProfile && (
        <div
          className="cookie-banner-container"
          style={{
            position: 'fixed',
            bottom: '18px',
            left: '16px',
            right: '16px',
            margin: '0 auto',
            width: 'calc(100% - 32px)',
            maxWidth: '840px',
            zIndex: 9998,
            animation: 'pageFade3D 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '18px 24px',
              borderRadius: '20px',
              background: 'var(--bg-card, rgba(13, 18, 32, 0.94))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border-bright, rgba(0, 242, 254, 0.3))',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 242, 254, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 360px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(0, 242, 254, 0.14)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f2fe',
                  flexShrink: 0,
                }}
              >
                <Cookie size={22} />
              </div>

              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {isFil ? 'Mahalaga ang Iyong Privacy at Seguridad' : 'We Value Your Privacy & Data Security'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  {isFil
                    ? 'Gumagamit ang Resiboss ng cookies at browser storage upang mapanatili ang iyong secure session at maihiwalay ang iyong mga resibo. Sumusunod kami sa Republic Act 10173 (Data Privacy Act of 2012).'
                    : 'Resiboss uses cookies and local storage to secure your session, isolate your receipts, and save your theme. We strictly adhere to Republic Act 10173 (Data Privacy Act of 2012).'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx?.playClick?.();
                      setIsPrivacyOpen(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#00f2fe',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {isFil ? 'Basahin ang Patakaran' : 'Privacy Policy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setIsCookieModalOpen(true);
                }}
                className="liquid-btn liquid-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sliders size={14} />
                <span>{isFil ? 'I-customize' : 'Preferences'}</span>
              </button>

              <button
                type="button"
                onClick={handleEssentialOnly}
                className="liquid-btn liquid-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                {isFil ? 'Mahalaga Lamang' : 'Essential Only'}
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="liquid-btn liquid-btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              >
                <CheckCircle2 size={15} />
                <span>{isFil ? 'Tanggapin Lahat' : 'Accept All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Cookie Preferences Modal */}
      {isCookieModalOpen && (
        <div
          className="terms-modal-backdrop"
          onClick={() => setIsCookieModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'pageFade3D 0.25s ease-out forwards',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              borderRadius: '24px',
              overflow: 'hidden',
              background: 'var(--bg-card, rgba(13, 18, 32, 0.96))',
              border: '1px solid var(--glass-border-bright, rgba(255, 255, 255, 0.15))',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface, rgba(15, 23, 42, 0.6))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(0, 242, 254, 0.12)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f2fe',
                  }}
                >
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {isFil ? 'Kagustuhan sa Cookie at Storage' : 'Cookie & Storage Preferences'}
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isFil ? 'Piliin ang mga kategoryang nais mong payagan.' : 'Choose the categories of storage you wish to allow.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCookieModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  borderRadius: '10px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Preference Categories */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Strictly Necessary (Locked) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(0, 242, 254, 0.04)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Lock size={16} color="#00f2fe" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isFil ? 'Mahalagang Imbakan (Strictly Necessary)' : 'Strictly Necessary Storage'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(0, 242, 254, 0.16)',
                        color: '#00f2fe',
                        fontWeight: 700,
                      }}
                    >
                      {isFil ? 'Laging Aktibo' : 'Always Active'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {isFil
                      ? 'Kinakailangan upang mapanatili ang iyong Google OAuth authentication, i-encrypt ang sesyon, at tiyaking tanging ang iyong account lang ang makakakita sa iyong mga resibo sa Document Vault.'
                      : 'Essential for maintaining your authenticated session, protecting your data, and ensuring strict account isolation so other users cannot access your receipts.'}
                  </p>
                </div>
              </div>

              {/* 2. Functional Storage (Toggleable) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Sparkles size={16} color="#38bdf8" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isFil ? 'Kagustuhan sa Sistema (Functional Preferences)' : 'Functional Preferences'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {isFil
                      ? 'Tinatandaan ang iyong Dark/Light theme, napiling wika (English/Filipino), tunog (Sound FX), at custom avatar zoom.'
                      : 'Remembers your chosen UI theme (Dark/Light mode), language selection, sound effects, and custom profile zoom.'}
                  </p>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => {
                      soundFx?.playClick?.();
                      setPreferences((prev) => ({ ...prev, functional: e.target.checked }));
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      inset: 0,
                      backgroundColor: preferences.functional ? '#00f2fe' : 'rgba(255, 255, 255, 0.16)',
                      transition: '0.2s',
                      borderRadius: '24px',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: preferences.functional ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#030712',
                        transition: '0.2s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* 3. Performance & Diagnostic Telemetry */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Info size={16} color="#a855f7" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isFil ? 'Diyagnostiko at Pagganap (Performance & Diagnostics)' : 'Performance & Diagnostics'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {isFil
                      ? 'Tumutulong upang mapabuti ang OCR parsing speed at matukoy ang mga error. Walang ibinabahaging pribadong resibo o personal na impormasyon.'
                      : 'Assists in measuring application load times and diagnosing OCR parsing errors. No receipt details or private contents are shared.'}
                  </p>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => {
                      soundFx?.playClick?.();
                      setPreferences((prev) => ({ ...prev, analytics: e.target.checked }));
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      inset: 0,
                      backgroundColor: preferences.analytics ? '#00f2fe' : 'rgba(255, 255, 255, 0.16)',
                      transition: '0.2s',
                      borderRadius: '24px',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: preferences.analytics ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#030712',
                        transition: '0.2s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--glass-border)',
                background: 'var(--bg-surface, rgba(10, 16, 36, 0.75))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="liquid-btn liquid-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                {isFil ? 'Tanggihan ang Di-kailangan' : 'Reject Non-Essential'}
              </button>

              <button
                type="button"
                onClick={handleSavePreferences}
                className="liquid-btn liquid-btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.84rem' }}
              >
                <CheckCircle2 size={15} />
                <span>{isFil ? 'I-save ang mga Kagustuhan' : 'Save Preferences'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsentBanner;
