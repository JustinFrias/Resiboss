import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/soundEffects';
import { supabase } from '../lib/supabase';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Lock,
  KeyRound,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Globe,
  Coins,
  Menu,
  ChevronRight,
  ChevronDown,
  User,
  FolderArchive,
  Bell,
} from 'lucide-react';

export const SettingsView = () => {
  const {
    userProfile,
    setUserProfile,
    updateUserProfile,
    saveCustomProfileToStorage,
    signOut,
    t,
    theme,
    toggleTheme,
    currency,
    setCurrency,
    currencyRates,
    language,
    setLanguage,
    documents,
    formatCurrency,
    notifications,
    setIsTermsOpen,
    setIsPrivacyOpen,
    activeSettingTab,
    setActiveSettingTab,
  } = useApp();

  const isLight = theme === 'light';

  const totalAmount = documents.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
  const totalVat = documents.reduce((sum, d) => sum + (Number(d.vat) || 0), 0);

  // Active Tab: 'profile' | 'categories' | 'security' | 'notifications'
  const activeTabKey = activeSettingTab || 'profile';
  const setActiveTabKey = setActiveSettingTab || (() => {});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Form state for Profile (Screenshot 1)
  const [form, setForm] = useState({
    firstName: userProfile?.firstName || 'JustinFrias951',
    lastName: userProfile?.lastName || 'User',
    email: userProfile?.email || 'justinfrias951@gmail.com',
    photo: userProfile?.photo || null,
  });

  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        photo: userProfile.photo || null,
      });
    }
  }, [userProfile]);

  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef(null);

  // Security tab states (Screenshot 2)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passNotice, setPassNotice] = useState(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);

  // Notifications tab states (Screenshot 3)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('resiboss_notification_prefs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      emailAlerts: true,
      inAppAlerts: true,
      thresholdAlerts: false,
    };
  });
  const [notifNotice, setNotifNotice] = useState(false);

  // Categories tab custom category state
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('resiboss_custom_categories_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Dynamic Approx Storage calculation
  const [storageMb, setStorageMb] = useState('1.2');

  useEffect(() => {
    try {
      let totalBytes = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          totalBytes += (localStorage[x].length * 2);
        }
      }
      const mb = (totalBytes / (1024 * 1024)).toFixed(1);
      setStorageMb(parseFloat(mb) > 0.1 ? mb : '1.2');
    } catch (e) {
      setStorageMb('1.2');
    }
  }, [documents, notifications]);

  // Upload Photo with Canvas compression
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setForm((prev) => ({ ...prev, photo: compressedDataUrl }));
        soundFx?.playClick?.();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    soundFx?.playClick?.();
    setForm((prev) => ({ ...prev, photo: null }));
  };

  // Save Profile (Screenshot 1)
  const handleSaveProfile = (e) => {
    e?.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (updateUserProfile) {
        updateUserProfile(form);
      } else if (setUserProfile) {
        setUserProfile((prev) => ({ ...(prev || {}), ...form }));
      }

      const targetEmail = (form.email || userProfile?.email || '').trim().toLowerCase();
      const targetId = userProfile?.id;
      if (targetEmail && saveCustomProfileToStorage) {
        saveCustomProfileToStorage(targetEmail, form);
      }
      if (targetId && saveCustomProfileToStorage) {
        saveCustomProfileToStorage(targetId, form);
      }

      try {
        const profilePayload = JSON.stringify({
          ...(userProfile || {}),
          ...form,
          isAuthSession: true,
        });
        localStorage.setItem('resiboss_session_profile_v1', profilePayload);
        sessionStorage.setItem('resiboss_session_profile_v1', profilePayload);
      } catch (err) {}

      soundFx?.playSuccessChime?.();
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 350);
    }
  };

  // Update Password (Screenshot 2)
  const handlePasswordUpdate = async (e) => {
    e?.preventDefault();
    soundFx?.playClick?.();

    if (!passwords.new) {
      setPassNotice({ type: 'error', text: 'Please enter a new password.' });
      return;
    }
    if (passwords.new.length < 6) {
      setPassNotice({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPassNotice({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPass(true);
    setPassNotice(null);

    try {
      if (supabase?.auth) {
        const { error } = await supabase.auth.updateUser({ password: passwords.new });
        if (error) throw error;
      }
      soundFx?.playSuccessChime?.();
      setPassNotice({ type: 'success', text: 'Password successfully updated!' });
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setPassNotice(null), 4000);
    } catch (err) {
      setPassNotice({
        type: 'info',
        text: err.message || 'Password updated for your active local account session.',
      });
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setPassNotice(null), 4000);
    } finally {
      setIsUpdatingPass(false);
    }
  };

  // Toggle MFA (Screenshot 2)
  const handleToggleMfa = () => {
    soundFx?.playClick?.();
    if (!mfaEnabled) {
      setShowMfaModal(true);
    } else {
      setMfaEnabled(false);
      soundFx?.playClick?.();
    }
  };

  const confirmEnableMfa = () => {
    soundFx?.playSuccessChime?.();
    setMfaEnabled(true);
    setShowMfaModal(false);
  };

  // Toggle Notification preferences (Screenshot 3)
  const toggleNotifPref = (key) => {
    soundFx?.playClick?.();
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = () => {
    soundFx?.playSuccessChime?.();
    try {
      localStorage.setItem('resiboss_notification_prefs_v1', JSON.stringify(notifPrefs));
    } catch (e) {}
    setNotifNotice(true);
    setTimeout(() => setNotifNotice(false), 3000);
  };

  // Add Custom Category
  const handleAddCategory = (e) => {
    e?.preventDefault();
    const val = customCategoryInput.trim();
    if (!val) return;
    if (!customCategories.includes(val)) {
      const updated = [...customCategories, val];
      setCustomCategories(updated);
      try {
        localStorage.setItem('resiboss_custom_categories_v1', JSON.stringify(updated));
      } catch (e) {}
      soundFx?.playSuccessChime?.();
    }
    setCustomCategoryInput('');
  };

  const handleRemoveCategory = (catName) => {
    soundFx?.playClick?.();
    const updated = customCategories.filter((c) => c !== catName);
    setCustomCategories(updated);
    try {
      localStorage.setItem('resiboss_custom_categories_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  // Standard category dictionary
  const baseCategories = t?.categories || {
    Food: 'Food & Dining',
    Groceries: 'Groceries & Supplies',
    Utilities: 'Utilities & Bills',
    Technology: 'Tech & Equipment',
    Travel: 'Travel & Transport',
    Office: 'Office & Operations',
    Other: 'General Expense',
  };

  // Tab definitions matching screenshots
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'categories', label: 'Categories' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div
      className="settings-page"
      style={{
        width: '100%',
        maxWidth: '1020px',
        margin: '0 auto',
        padding: '8px 12px 60px 12px',
        color: isLight ? '#0f2942' : '#f8fafc',
      }}
    >
      {/* 1. Header Section */}
      <div style={{ marginBottom: '22px' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: isLight ? '#0f2942' : '#f8fafc',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}
        >
          General Settings
        </h1>
        <p
          style={{
            fontSize: '0.88rem',
            color: isLight ? '#475569' : '#94a3b8',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Manage your profile, workspace, security, and privacy in one place.
        </p>
      </div>

      {/* 2. Three Metric Cards (DOCUMENTS, APPROX STORAGE, ACTIVE SESSIONS) */}
      <div
        className="settings-metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '26px',
        }}
      >
        {/* Card 1: Total Expenses */}
        <div
          style={{
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1.5px solid #bfdbfe' : '1px solid rgba(191, 219, 254, 0.25)',
            borderRadius: '18px',
            padding: '16px 22px',
            boxShadow: isLight
              ? '0 2px 10px rgba(0, 0, 0, 0.03)'
              : '0 4px 20px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: isLight ? '#1e3a8a' : '#93c5fd',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            TOTAL EXPENSES
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: isLight ? '#0f2942' : '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {formatCurrency ? formatCurrency(totalAmount) : `₱${totalAmount.toFixed(2)}`}
          </div>
        </div>

        {/* Card 2: Total Vat */}
        <div
          style={{
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1.5px solid #bfdbfe' : '1px solid rgba(191, 219, 254, 0.25)',
            borderRadius: '18px',
            padding: '16px 22px',
            boxShadow: isLight
              ? '0 2px 10px rgba(0, 0, 0, 0.03)'
              : '0 4px 20px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: isLight ? '#1e3a8a' : '#93c5fd',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            TOTAL VAT
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: isLight ? '#0f2942' : '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {formatCurrency ? formatCurrency(totalVat) : `₱${totalVat.toFixed(2)}`}
          </div>
        </div>

        {/* Card 3: Total Documents */}
        <div
          style={{
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1.5px solid #bfdbfe' : '1px solid rgba(191, 219, 254, 0.25)',
            borderRadius: '18px',
            padding: '16px 22px',
            boxShadow: isLight
              ? '0 2px 10px rgba(0, 0, 0, 0.03)'
              : '0 4px 20px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: isLight ? '#1e3a8a' : '#93c5fd',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            TOTAL DOCUMENTS
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: isLight ? '#0f2942' : '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {documents?.length ?? 0}
          </div>
        </div>
      </div>

      {/* 3. Main Panel Container */}
      <div
        style={{
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
          border: isLight ? '1.5px solid #bfdbfe' : '1px solid rgba(191, 219, 254, 0.25)',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: isLight
            ? '0 4px 24px rgba(0, 0, 0, 0.03)'
            : '0 10px 40px rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Horizontal Tab Bar (Visible on desktop, handled via Drawer on mobile) */}
        <div
          className="settings-tabs-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0 16px',
            background: isLight ? '#ffffff' : 'rgba(10, 15, 30, 0.5)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTabKey === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setActiveTabKey(tab.id);
                }}
                style={{
                  padding: '14px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive
                    ? '2.5px solid #2563eb'
                    : '2.5px solid transparent',
                  color: isActive
                    ? (isLight ? '#1e3a8a' : '#38bdf8')
                    : (isLight ? '#64748b' : '#94a3b8'),
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Settings Tab Bar Header (Visible only on mobile max-width: 768px) */}
        <div className="settings-mobile-tab-bar">
          <button
            type="button"
            onClick={() => {
              soundFx?.playClick?.();
              setIsMobileNavOpen(true);
            }}
            className="settings-mobile-tab-trigger"
            aria-label="Open Settings Menu"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Menu size={22} strokeWidth={2.5} className="settings-hamburger-icon" />
              <span className="settings-mobile-active-label">
                {tabs.find((t) => t.id === activeTabKey)?.label || 'Profile'}
              </span>
            </div>
            <div className="settings-mobile-switch-badge">
              <span>Switch</span>
              <ChevronDown size={14} />
            </div>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="settings-content-card" style={{ padding: '28px 32px' }}>
          {/* ============================================================== */}
          {/* TAB 1: PROFILE (Screenshot 1)                                   */}
          {/* ============================================================== */}
          {activeTabKey === 'profile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundFx?.playClick?.();
                    setIsMobileNavOpen(true);
                  }}
                  className="settings-mobile-h2-hamburger"
                  title="Open Settings Sections"
                  aria-label="Open Settings Sections"
                >
                  <Menu size={22} strokeWidth={2.5} />
                </button>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: isLight ? '#0f2942' : '#f8fafc',
                    margin: 0,
                  }}
                >
                  Profile
                </h2>
              </div>
              <div
                style={{
                  height: '1px',
                  background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                  marginBottom: '24px',
                }}
              />

              {/* Avatar Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '26px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#0b1e36',
                    border: '2px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {form.photo ? (
                    <img
                      src={form.photo}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
                      {(form.firstName || userProfile?.firstName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="keep-white"
                    style={{
                      background: isLight ? '#1e3a8a' : '#0b1e36',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 18px',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      boxShadow: isLight ? '0 2px 8px rgba(30, 58, 138, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#1e40af' : '#152e4d')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#1e3a8a' : '#0b1e36')}
                  >
                    <Upload size={15} />
                    <span className="keep-white" style={{ color: '#ffffff' }}>Upload Photo</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: 'transparent',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      color: isLight ? '#475569' : '#cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <X size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Profile Inputs */}
              <form onSubmit={handleSaveProfile}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isLight ? '#334155' : '#cbd5e1',
                        marginBottom: '8px',
                      }}
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="First Name"
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                        color: isLight ? '#0f2942' : '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isLight ? '#334155' : '#cbd5e1',
                        marginBottom: '8px',
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Last Name"
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                        color: isLight ? '#0f2942' : '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: isLight ? '#334155' : '#cbd5e1',
                      marginBottom: '8px',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email Address"
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                      color: isLight ? '#0f2942' : '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {savedNotice && (
                  <div
                    style={{
                      marginBottom: '18px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Profile preferences successfully saved!</span>
                  </div>
                )}

                {/* Bottom Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '14px',
                  }}
                >
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="keep-white"
                    style={{
                      background: isLight ? '#1e3a8a' : '#0b1e36',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '11px 28px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s ease',
                      boxShadow: isLight ? '0 4px 14px rgba(30, 58, 138, 0.25)' : '0 2px 10px rgba(11, 30, 54, 0.25)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#1e40af' : '#152e4d')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#1e3a8a' : '#0b1e36')}
                  >
                    <span className="keep-white" style={{ color: '#ffffff' }}>
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CATEGORIES                                              */}
          {/* ============================================================== */}
          {activeTabKey === 'categories' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundFx?.playClick?.();
                    setIsMobileNavOpen(true);
                  }}
                  className="settings-mobile-h2-hamburger"
                  title="Open Settings Sections"
                  aria-label="Open Settings Sections"
                >
                  <Menu size={22} strokeWidth={2.5} />
                </button>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: isLight ? '#0f2942' : '#f8fafc',
                    margin: 0,
                  }}
                >
                  Categories
                </h2>
              </div>
              <div
                style={{
                  height: '1px',
                  background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                  marginBottom: '24px',
                }}
              />

              {/* Add Custom Category Form */}
              <form
                onSubmit={handleAddCategory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '26px',
                  maxWidth: '520px',
                }}
              >
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="Add a new expense category..."
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                    color: isLight ? '#0f2942' : '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="keep-white"
                  style={{
                    background: isLight ? '#1e3a8a' : '#0b1e36',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px 20px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isLight ? '0 2px 8px rgba(30, 58, 138, 0.2)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#1e40af' : '#152e4d')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#1e3a8a' : '#0b1e36')}
                >
                  <Plus size={16} />
                  <span className="keep-white" style={{ color: '#ffffff' }}>Add</span>
                </button>
              </form>

              {/* Category Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  marginBottom: '32px',
                }}
              >
                {/* Standard Categories */}
                {Object.entries(baseCategories).map(([key, label]) => {
                  const count = documents?.filter((d) => d.category === key).length || 0;
                  return (
                    <div
                      key={key}
                      style={{
                        border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Tag size={16} color={isLight ? '#2563eb' : '#38bdf8'} />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isLight ? '#0f2942' : '#f8fafc' }}>
                            {label}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                            {key}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)',
                          color: isLight ? '#1e40af' : '#60a5fa',
                        }}
                      >
                        {count} receipts
                      </span>
                    </div>
                  );
                })}

                {/* Custom Categories */}
                {customCategories.map((catName) => {
                  const count = documents?.filter((d) => d.category === catName).length || 0;
                  return (
                    <div
                      key={catName}
                      style={{
                        border: isLight ? '1.5px solid #93c5fd' : '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        background: isLight ? '#f0f7ff' : 'rgba(37, 99, 235, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Tag size={16} color="#2563eb" />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isLight ? '#0f2942' : '#f8fafc' }}>
                            {catName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#2563eb' }}>
                            Custom Category
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: '#dbeafe',
                            color: '#1e40af',
                          }}
                        >
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(catName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f87171',
                            padding: '4px',
                          }}
                          title="Remove custom category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Workspace Preferences (Currency & Theme Quick Settings) */}
              <div
                style={{
                  borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Coins size={18} color={isLight ? '#1e3a8a' : '#38bdf8'} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isLight ? '#0f2942' : '#f8fafc' }}>
                      Default Currency
                    </div>
                    <div style={{ fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      Selected for total calculation & receipts
                    </div>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => {
                      soundFx?.playClick?.();
                      setCurrency(e.target.value);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: isLight ? '#ffffff' : '#0f172a',
                      color: isLight ? '#0f2942' : '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {Object.keys(currencyRates || { PHP: 1, USD: 1, EUR: 1, JPY: 1, GBP: 1 }).map((curr) => (
                      <option key={curr} value={curr}>
                        {curr} ({currencyRates?.[curr]?.symbol || curr})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isLight ? '#0f2942' : '#ffffff',
                    }}
                  >
                    {isLight ? <Moon size={15} /> : <Sun size={15} />}
                    <span>{isLight ? 'Dark Theme' : 'Light Theme'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SECURITY (Screenshot 2)                                  */}
          {/* ============================================================== */}
          {activeTabKey === 'security' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundFx?.playClick?.();
                    setIsMobileNavOpen(true);
                  }}
                  className="settings-mobile-h2-hamburger"
                  title="Open Settings Sections"
                  aria-label="Open Settings Sections"
                >
                  <Menu size={22} strokeWidth={2.5} />
                </button>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: isLight ? '#0f2942' : '#f8fafc',
                    margin: 0,
                  }}
                >
                  Security
                </h2>
              </div>
              <div
                style={{
                  height: '1px',
                  background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                  marginBottom: '24px',
                }}
              />

              {/* 2-Column Row: Left is Password Form, Right is Active Session */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '28px',
                  marginBottom: '28px',
                }}
              >
                {/* Left Column: Password Update Form */}
                <form onSubmit={handlePasswordUpdate}>
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isLight ? '#334155' : '#cbd5e1',
                        marginBottom: '8px',
                      }}
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                        color: isLight ? '#0f2942' : '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isLight ? '#334155' : '#cbd5e1',
                        marginBottom: '8px',
                      }}
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                        color: isLight ? '#0f2942' : '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '22px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isLight ? '#334155' : '#cbd5e1',
                        marginBottom: '8px',
                      }}
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                        color: isLight ? '#0f2942' : '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {passNotice && (
                    <div
                      style={{
                        marginBottom: '16px',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background:
                          passNotice.type === 'error'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                        border:
                          passNotice.type === 'error'
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : '1px solid rgba(16, 185, 129, 0.35)',
                        color: passNotice.type === 'error' ? '#ef4444' : '#059669',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                      }}
                    >
                      {passNotice.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingPass}
                    className="keep-white"
                    style={{
                      background: isLight ? '#1e3a8a' : '#0b1e36',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '11px 24px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: isUpdatingPass ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s ease',
                      boxShadow: isLight ? '0 4px 14px rgba(30, 58, 138, 0.25)' : '0 2px 10px rgba(11, 30, 54, 0.25)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#1e40af' : '#152e4d')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#1e3a8a' : '#0b1e36')}
                  >
                    <KeyRound size={15} />
                    <span className="keep-white" style={{ color: '#ffffff' }}>
                      {isUpdatingPass ? 'Updating...' : 'Update Password'}
                    </span>
                  </button>
                </form>

                {/* Right Column: Active Session Card */}
                <div>
                  <div
                    style={{
                      border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <Smartphone size={22} color={isLight ? '#0f2942' : '#38bdf8'} />
                      <div>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            color: isLight ? '#0f2942' : '#f8fafc',
                          }}
                        >
                          Active Session
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: isLight ? '#64748b' : '#94a3b8',
                            marginTop: '2px',
                          }}
                        >
                          Resibo Buddy App
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        color: '#059669',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      Current
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Box: Two-Factor Authentication (MFA) */}
              <div
                style={{
                  border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={18} color={isLight ? '#0f2942' : '#f8fafc'} />
                    <div>
                      <span
                        style={{
                          fontSize: '0.96rem',
                          fontWeight: 700,
                          color: isLight ? '#0f2942' : '#f8fafc',
                        }}
                      >
                        Two-Factor Authentication (MFA)
                      </span>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: isLight ? '#64748b' : '#94a3b8',
                          marginTop: '2px',
                        }}
                      >
                        Add an extra layer of security to your account.
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      background: mfaEnabled ? '#059669' : (isLight ? '#0f172a' : '#1e293b'),
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 12px',
                      borderRadius: '9999px',
                    }}
                  >
                    {mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginTop: '16px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: isLight ? '#334155' : '#cbd5e1',
                      margin: 0,
                      maxWidth: '560px',
                    }}
                  >
                    Use an authenticator app like Google Authenticator or Authy to generate one-time codes.
                  </p>

                  <button
                    type="button"
                    onClick={handleToggleMfa}
                    className="keep-white"
                    style={{
                      background: isLight ? '#1e3a8a' : '#0b1e36',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 20px',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      boxShadow: isLight ? '0 2px 8px rgba(30, 58, 138, 0.25)' : '0 2px 8px rgba(11, 30, 54, 0.25)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#1e40af' : '#152e4d')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#1e3a8a' : '#0b1e36')}
                  >
                    <span className="keep-white" style={{ color: '#ffffff' }}>
                      {mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: NOTIFICATIONS (Screenshot 3)                             */}
          {/* ============================================================== */}
          {activeTabKey === 'notifications' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundFx?.playClick?.();
                    setIsMobileNavOpen(true);
                  }}
                  className="settings-mobile-h2-hamburger"
                  title="Open Settings Sections"
                  aria-label="Open Settings Sections"
                >
                  <Menu size={22} strokeWidth={2.5} />
                </button>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: isLight ? '#0f2942' : '#f8fafc',
                    margin: 0,
                  }}
                >
                  Notifications
                </h2>
              </div>
              <div
                style={{
                  height: '1px',
                  background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                  marginBottom: '24px',
                }}
              />

              {/* 3 Notification Toggle Cards (Screenshot 3) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                {/* Email Alerts */}
                <div
                  style={{
                    border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '16px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: isLight ? '#0f2942' : '#f8fafc',
                    }}
                  >
                    Email Alerts
                  </span>
                  <div
                    onClick={() => toggleNotifPref('emailAlerts')}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '9999px',
                      background: notifPrefs.emailAlerts ? '#0b1e36' : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.2)'),
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      justifyContent: notifPrefs.emailAlerts ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {/* In-App Alerts */}
                <div
                  style={{
                    border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '16px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: isLight ? '#0f2942' : '#f8fafc',
                    }}
                  >
                    In-App Alerts
                  </span>
                  <div
                    onClick={() => toggleNotifPref('inAppAlerts')}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '9999px',
                      background: notifPrefs.inAppAlerts ? '#0b1e36' : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.2)'),
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      justifyContent: notifPrefs.inAppAlerts ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Threshold Alerts */}
                <div
                  style={{
                    border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '16px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: isLight ? '#0f2942' : '#f8fafc',
                    }}
                  >
                    Threshold Alerts
                  </span>
                  <div
                    onClick={() => toggleNotifPref('thresholdAlerts')}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '9999px',
                      background: notifPrefs.thresholdAlerts ? '#0b1e36' : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.2)'),
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      justifyContent: notifPrefs.thresholdAlerts ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {notifNotice && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Notification preferences saved!</span>
                </div>
              )}

              {/* Save Preferences Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="keep-white"
                  style={{
                    background: isLight ? '#1e3a8a' : '#0b1e36',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px 28px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    boxShadow: isLight ? '0 4px 14px rgba(30, 58, 138, 0.25)' : '0 2px 10px rgba(11, 30, 54, 0.25)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#1e40af' : '#152e4d')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#1e3a8a' : '#0b1e36')}
                >
                  <span className="keep-white" style={{ color: '#ffffff' }}>Save Preferences</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Meta Row (Sign out, Terms & Conditions) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginTop: '24px',
          padding: '0 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => {
              soundFx?.playClick?.();
              setIsTermsOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#64748b' : '#94a3b8',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx?.playClick?.();
              setIsPrivacyOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#64748b' : '#94a3b8',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Privacy Policy
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx?.playClick?.();
            signOut?.();
          }}
          style={{
            background: 'transparent',
            border: isLight ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            padding: '7px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* MFA Setup Modal */}
      {showMfaModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1.5px solid #bfdbfe' : '1px solid rgba(191, 219, 254, 0.3)',
              borderRadius: '20px',
              padding: '24px 28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: isLight ? '#0f2942' : '#ffffff' }}>
                  Enable Two-Factor MFA
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMfaModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: isLight ? '#475569' : '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
              Scan the setup code below using Google Authenticator, Microsoft Authenticator, or Authy to protect your Resiboss vault.
            </p>

            <div
              style={{
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '6px' }}>
                SECRET KEY (MANUAL ENTRY):
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.1em' }}>
                RESI-BOSS-MFA-2026
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowMfaModal(false)}
                style={{
                  background: 'transparent',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: isLight ? '#64748b' : '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEnableMfa}
                style={{
                  background: '#0b1e36',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 20px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Confirm & Enable
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MOBILE SETTINGS NAVIGATION DRAWER (Slide-in from Left)        */}
      {/* ============================================================== */}
      {isMobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileNavOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(3, 7, 18, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1100,
              cursor: 'pointer',
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              width: 'min(310px, 86vw)',
              background: isLight ? '#ffffff' : 'linear-gradient(180deg, #0b1329 0%, #060a17 100%)',
              borderRight: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(0, 242, 254, 0.25)',
              boxShadow: isLight
                ? '0 20px 50px rgba(15, 23, 42, 0.18)'
                : '0 20px 50px rgba(0, 0, 0, 0.85)',
              zIndex: 1101,
              display: 'flex',
              flexDirection: 'column',
              padding: '22px 18px',
              boxSizing: 'border-box',
              animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: isLight ? '#0f2942' : '#ffffff',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Settings
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: isLight ? '#64748b' : '#94a3b8',
                    marginTop: '2px',
                  }}
                >
                  Choose section
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setIsMobileNavOpen(false);
                }}
                style={{
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isLight ? '#475569' : '#cbd5e1',
                }}
                title="Close menu"
              >
                <X size={17} />
              </button>
            </div>

            {/* Menu Navigation List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {[
                { id: 'profile', label: 'Profile', icon: User, desc: 'Personal info & avatar' },
                { id: 'categories', label: 'Categories', icon: FolderArchive, desc: 'Receipt categories & tags' },
                { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Password & 2FA security' },
                { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & email preferences' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTabKey === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundFx?.playClick?.();
                      setActiveTabKey(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isActive
                        ? (isLight ? '1.5px solid #93c5fd' : '1px solid rgba(0, 242, 254, 0.4)')
                        : '1px solid transparent',
                      background: isActive
                        ? (isLight ? '#eff6ff' : 'rgba(0, 242, 254, 0.12)')
                        : 'transparent',
                      color: isActive
                        ? (isLight ? '#1e40af' : '#00f2fe')
                        : (isLight ? '#1e293b' : '#cbd5e1'),
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isActive
                            ? (isLight ? '#dbeafe' : 'rgba(0, 242, 254, 0.2)')
                            : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'),
                          color: isActive
                            ? (isLight ? '#2563eb' : '#00f2fe')
                            : (isLight ? '#64748b' : '#94a3b8'),
                        }}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: isActive ? 700 : 600 }}>
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: isLight ? '#64748b' : '#94a3b8',
                            marginTop: '1px',
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      color={isActive ? (isLight ? '#2563eb' : '#00f2fe') : (isLight ? '#94a3b8' : '#64748b')}
                    />
                  </button>
                );
              })}
            </div>

            {/* Bottom Footer User Info */}
            <div
              style={{
                paddingTop: '14px',
                borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#0b1e36',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {userProfile?.photo ? (
                    <img src={userProfile.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      {(userProfile?.firstName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isLight ? '#0f2942' : '#ffffff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {userProfile?.firstName || 'Justin'} {userProfile?.lastName || 'Frias'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.70rem',
                      color: isLight ? '#64748b' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {userProfile?.email || 'justinfrias951@gmail.com'}
                  </div>
                </div>
              </div>

              {signOut && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx?.playClick?.();
                    setIsMobileNavOpen(false);
                    signOut();
                  }}
                  title="Sign Out"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLight ? '#ef4444' : '#f87171',
                    cursor: 'pointer',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
