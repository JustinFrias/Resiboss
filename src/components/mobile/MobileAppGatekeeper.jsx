import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../../context/AppContext';
import { hasCachedSession } from '../../utils/sessionCache';
import {
  Smartphone,
  Download,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Camera,
  ShieldCheck,
  Zap,
  ArrowRight,
  Apple,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';

export const MobileAppGatekeeper = ({ children }) => {
  const { userProfile } = useApp();
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [isBypassed, setIsBypassed] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        if (Capacitor.isNativePlatform() || hasCachedSession()) {
          return true;
        }
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1' || h.includes('192.168.') || h.includes('.local')) {
          return true;
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('web') === '1' || urlParams.get('preview') === '1' || urlParams.get('bypass') === 'mobile') {
          return true;
        }
        if (
          sessionStorage.getItem('resiboss_mobile_web_bypass') === 'true' ||
          localStorage.getItem('resiboss_mobile_web_bypass') === 'true'
        ) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  });
  const [checking, setChecking] = useState(() => {
    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform() || hasCachedSession()) {
        return false;
      }
      const h = window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' || h.includes('192.168.') || h.includes('.local')) {
        return false;
      }
    }
    return true;
  });

  // Safety net: always resolve checking within 500ms to prevent a permanent white screen
  useEffect(() => {
    const timeout = setTimeout(() => setChecking(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  const [isApple, setIsApple] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 0. On localhost or development, always bypass gatekeeper so local development and responsive testing work cleanly
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.') ||
        window.location.hostname.includes('.local'));

    if (isLocalhost) {
      setIsBypassed(true);
      setChecking(false);
      return;
    }

    // 1. Check if running inside the native Android Capacitor APK
    const isNative = Capacitor.isNativePlatform();

    // 2. Check for manual bypass in sessionStorage or URL query (?web=1 or ?preview=1)
    const urlParams = new URLSearchParams(window.location.search);
    const hasBypassParam = urlParams.get('web') === '1' || urlParams.get('preview') === '1' || urlParams.get('bypass') === 'mobile';
    const hasSessionBypass =
      sessionStorage.getItem('resiboss_mobile_web_bypass') === 'true' ||
      localStorage.getItem('resiboss_mobile_web_bypass') === 'true';

    if (hasBypassParam || hasSessionBypass) {
      setIsBypassed(true);
      setChecking(false);
      return;
    }

    // If running in Native APK, never show gatekeeper
    if (isNative) {
      setIsMobileBrowser(false);
      setChecking(false);
      return;
    }

    // 3. Detect device type (Apple iOS vs Android)
    const userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    const appleMatch = /iphone|ipad|ipod/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const androidMatch = /android/i.test(userAgent);
    setIsApple(appleMatch);
    setIsAndroid(androidMatch);

    const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|silk/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 820 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (isMobileUA || isSmallScreen) {
      setIsMobileBrowser(true);
    } else {
      setIsMobileBrowser(false);
    }

    setChecking(false);

    const handleResize = () => {
      if (!Capacitor.isNativePlatform()) {
        const checkSmall = window.innerWidth <= 820 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        setIsMobileBrowser(isMobileUA || checkSmall);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadApk = () => {
    // Direct trigger to download Resiboss APK
    const apkUrl = '/resiboss.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'Resiboss_v1.0_Release.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNativeApp = () => {
    // Attempt deep link or Android Intent
    try {
      window.location.href = 'resiboss://open';
      setTimeout(() => {
        // Fallback to Android Intent if app not directly responding
        window.location.href = 'intent://resiboss.vercel.app#Intent;scheme=https;package=com.resiboss.app;end';
      }, 1200);
    } catch (e) {
      console.warn('App link failed:', e);
    }
  };

  const handleBypass = () => {
    try {
      localStorage.setItem('resiboss_mobile_web_bypass', 'true');
      sessionStorage.setItem('resiboss_mobile_web_bypass', 'true');
    } catch (e) {}
    setIsBypassed(true);
  };

  // If user is already logged in, has cached session, inside native APK, or manually bypassed, render normal application directly
  if (userProfile || hasCachedSession() || Capacitor.isNativePlatform() || isBypassed) {
    return children;
  }

  if (checking) {
    // Render the background color instead of a blank white page while we detect the environment
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#f8fafc',
          zIndex: 0,
        }}
      />
    );
  }

  if (!isMobileBrowser) {
    return children;
  }

  // Mobile Web Gatekeeper Screen
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'radial-gradient(circle at 50% 20%, #0d1527 0%, #060911 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        overflowY: 'auto',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      }}
    >
      {/* Background Ambience Glow */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.18), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '430px',
          borderRadius: '24px',
          padding: '28px 22px',
          background: 'rgba(10, 10, 10, 0.94)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Top Floating Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: isApple ? 'rgba(255, 255, 255, 0.12)' : 'rgba(56, 189, 248, 0.12)',
            border: isApple ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(56, 189, 248, 0.35)',
            color: isApple ? '#ffffff' : '#38bdf8',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '18px',
          }}
        >
          {isApple ? (
            <>
              <Apple size={13} />
              <span>Apple iOS (iPhone & iPad) PWA Ready</span>
            </>
          ) : (
            <>
              <Smartphone size={13} />
              <span>Official Android APK Available</span>
            </>
          )}
        </div>

        {/* Brand Icon Glow */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '22px',
            background: isApple
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(56, 189, 248, 0.2))'
              : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.28)',
            position: 'relative',
          }}
        >
          <img
            src="/resiboss-emblem.png"
            alt="Resiboss"
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Title & Description */}
        <h1
          style={{
            fontSize: '1.42rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: '0 0 8px 0',
          }}
        >
          {isApple ? 'Gamitin ang Resiboss sa iPhone & iPad' : 'Gamitin ang Resiboss Mobile App'}
        </h1>
        <p
          style={{
            fontSize: '0.84rem',
            color: '#94a3b8',
            lineHeight: 1.5,
            margin: '0 0 18px 0',
          }}
        >
          {isApple
            ? 'Ang .APK format ay para lamang sa Android. Sa Apple iOS, maaari mong i-install at gamitin ang Resiboss nang libre bilang official Home Screen Web App na may buong camera scanning at offline security!'
            : 'Ang mobile experience ng Resiboss para sa Android ay binuo bilang official APK para sa mabilis na camera OCR scanning, offline security vault, at seamless ledger management.'}
        </p>

        {/* Apple iOS Installation Guide OR Android Benefits Box */}
        {isApple ? (
          <div
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#38bdf8',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Apple size={14} />
              <span>Paano I-install sa iPhone / iPad (PWA):</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', flexShrink: 0 }}>1</span>
                <span>Pindutin ang <strong>Share</strong> icon sa ilalim ng Safari (parisukat na may arrow pataas <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', flexShrink: 0 }}>2</span>
                <span>Piliin ang <strong>"Add to Home Screen"</strong> (<PlusSquare size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Idagdag sa Home Screen).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', flexShrink: 0 }}>3</span>
                <span>I-tap ang <strong>"Add"</strong> sa kanang itaas para maging opisyal na app sa iyong iPhone screen!</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mga Kalamangan ng Resiboss APK:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={14} color="#20F8A1" style={{ flexShrink: 0 }} />
                <span>Direct Hardware Camera Control at Auto-focus OCR</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} color="#20F8A1" style={{ flexShrink: 0 }} />
                <span>Offline Document Vault at Naka-encrypt na Storage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} color="#20F8A1" style={{ flexShrink: 0 }} />
                <span>Mas mabilis, walang lag, at walang browser limits</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isApple ? (
            <>
              {/* Apple Primary Action: Open Web App Directly */}
              <button
                onClick={handleBypass}
                className="liquid-btn liquid-btn-primary"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                  boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#ffffff',
                }}
              >
                <Sparkles size={18} />
                <span>Buksan ang Resiboss sa Safari</span>
              </button>

              {/* Apple Secondary: Download Android APK if needed */}
              <button
                onClick={handleDownloadApk}
                className="liquid-btn liquid-btn-secondary"
                style={{
                  width: '100%',
                  padding: '11px 18px',
                  borderRadius: '14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
                title="I-download ang Android .APK installer file"
              >
                <Download size={14} />
                <span>I-download ang Android APK (Para sa Android)</span>
              </button>
            </>
          ) : (
            <>
              {/* 1. Android Download APK Button */}
              <button
                onClick={handleDownloadApk}
                className="liquid-btn liquid-btn-primary"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#ffffff',
                }}
              >
                <Download size={18} />
                <span>I-download ang Resiboss APK</span>
              </button>

              {/* 2. Open App Button (If already installed) */}
              <button
                onClick={handleOpenNativeApp}
                className="liquid-btn liquid-btn-secondary"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={15} />
                <span>Buksan ang Resiboss App</span>
              </button>

              {/* 3. Open in Browser Web Version */}
              <button
                onClick={handleBypass}
                className="liquid-btn liquid-btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <span>Magpatuloy sa Mobile Web Version</span>
              </button>
            </>
          )}
        </div>

        {/* Desktop Web Notice */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#64748b',
            fontSize: '0.75rem',
            textAlign: 'left',
          }}
        >
          <Laptop size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span>
            Nais mo bang gamitin ang desktop web? Buksan ang <strong style={{ color: '#94a3b8' }}>resiboss.vercel.app</strong> sa iyong laptop o computer.
          </span>
        </div>
      </div>
    </div>
  );
};
