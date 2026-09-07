import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Key,
  Globe,
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const PipedreamAuthCard = ({ onNavigateToSettings }) => {
  const {
    pipedreamAuthUrl,
    setPipedreamAuthUrl,
    signInWithPipedream,
    registerWithPipedream,
    signInWithGoogle,
    soundFx,
  } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Quick Webhook URL Config Expander
  const [showUrlConfig, setShowUrlConfig] = useState(!pipedreamAuthUrl);
  const [tempUrl, setTempUrl] = useState(pipedreamAuthUrl || '');
  const [urlSavedNotice, setUrlSavedNotice] = useState(false);

  const handleSaveWebhookUrl = (e) => {
    e?.preventDefault();
    const trimmed = tempUrl.trim();
    if (!trimmed) {
      setErrorMsg('Pakilagay ang wastong Pipedream Webhook URL.');
      return;
    }
    setPipedreamAuthUrl(trimmed);
    setUrlSavedNotice(true);
    soundFx?.playSuccessChime?.();
    setTimeout(() => setUrlSavedNotice(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx?.playClick?.();

    const activeUrl = pipedreamAuthUrl || tempUrl.trim();
    if (!activeUrl) {
      setErrorMsg('Kailangan muna ng Pipedream Webhook URL para makapag-sign in.');
      setShowUrlConfig(true);
      return;
    }

    if (!pipedreamAuthUrl && tempUrl.trim()) {
      setPipedreamAuthUrl(tempUrl.trim());
    }

    if (!email.trim() || !password) {
      setErrorMsg('Pakilagay ang iyong email at password.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMsg('Pakilagay ang iyong buong pangalan para makapag-rehistro.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await registerWithPipedream(fullName, email, password);
        setSuccessMsg('Account registered successfully! Welcome to Resiboss.');
        soundFx?.playSuccessChime?.();
      } else {
        await signInWithPipedream(email, password);
        setSuccessMsg('Signed in successfully!');
        soundFx?.playSuccessChime?.();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Nabigo ang authentication. Pakisubukang muli.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    soundFx?.playClick?.();
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize Google Sign-In.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        padding: '30px 24px',
        borderRadius: '24px',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 242, 254, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f2fe',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
            marginBottom: '12px',
          }}
        >
          <ShieldCheck size={28} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          {mode === 'login'
            ? 'Sign in to sync your receipts and manage your profile'
            : 'Register your account to access cloud backups anywhere'}
        </p>
      </div>

      {/* Mode Switcher Pill Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '14px',
          padding: '4px',
          marginBottom: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMsg(null);
            soundFx?.playClick?.();
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            background: mode === 'login' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent',
            color: mode === 'login' ? '#04101e' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMsg(null);
            soundFx?.playClick?.();
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            background: mode === 'register' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent',
            color: mode === 'register' ? '#04101e' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          Create Account
        </button>
      </div>

      {/* Webhook Status / Quick Config Toggle */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: pipedreamAuthUrl ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${pipedreamAuthUrl ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '10px',
            padding: '6px 12px',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: pipedreamAuthUrl ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 8px ${pipedreamAuthUrl ? '#10b981' : '#f59e0b'}`,
              }}
            />
            <span style={{ color: pipedreamAuthUrl ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
              {pipedreamAuthUrl ? 'Pipedream Webhook Connected' : 'Pipedream Webhook Not Set'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowUrlConfig(!showUrlConfig)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.74rem',
            }}
          >
            <span>{showUrlConfig ? 'Hide' : 'Configure'}</span>
            {showUrlConfig ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Collapsible Webhook URL Input */}
        {showUrlConfig && (
          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(10, 15, 30, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Pipedream Webhook Endpoint URL:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="url"
                placeholder="https://eo...m.pipedream.net"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSaveWebhookUrl}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 242, 254, 0.2)',
                  border: '1px solid rgba(0, 242, 254, 0.5)',
                  color: '#00f2fe',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
            {urlSavedNotice && (
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#34d399', marginTop: '4px' }}>
                ✓ Webhook URL saved locally!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error & Success Alerts */}
      {errorMsg && (
        <div
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.82rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* The Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mode === 'register' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                required
                placeholder="Justin Frias"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="liquid-btn liquid-btn-primary"
          style={{
            marginTop: '4px',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying via Pipedream...</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign In with Pipedream' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0 14px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          OR ALTERNATIVE
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
      </div>

      {/* Alternative Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          fontSize: '0.84rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/>
          <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"/>
        </svg>
        <span>Continue with Google (Supabase)</span>
      </button>
    </div>
  );
};
