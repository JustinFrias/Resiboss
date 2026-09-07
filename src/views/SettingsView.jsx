import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components/TiltCard';
import { soundFx } from '../utils/soundEffects';
import { PipedreamAuthCard } from '../components/PipedreamAuthCard';
import { PipedreamSetupTab } from '../components/PipedreamSetupTab';
import {
  Settings,
  Upload,
  X,
  CheckCircle2,
  FileText,
  HardDrive,
  Laptop,
  Layers,
  ShieldCheck,
  Bell,
  Sparkles,
  Volume2,
  Trash2,
  Plus,
  Save,
  Globe,
  DollarSign,
  Loader2,
  LogIn,
  LogOut,
  AlertCircle,
} from 'lucide-react';

export const SettingsView = () => {
  const {
    documents,
    currentUser,
    userProfile,
    setUserProfile,
    updateUserProfile,
    signInWithGoogle,
    signOut,
    language,
    setLanguage,
    currency,
    setCurrency,
    settings,
    setSettings,
    clearAllData,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState('Profile');
  const [form, setForm] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    email: userProfile?.email || '',
    photo: userProfile?.photo || null,
  });

  // Sync form state whenever userProfile updates
  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        photo: userProfile.photo || null,
      });
    } else {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        photo: null,
      });
    }
  }, [userProfile]);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    soundFx.playClick();
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'Failed to initialize Google Sign-In.');
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    soundFx.playClick();
    if (signOut) {
      await signOut();
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef(null);

  // Categories list state
  const [categoriesList, setCategoriesList] = useState([
    { name: 'Food & Dining', count: 18, color: '#f59e0b' },
    { name: 'Groceries', count: 12, color: '#10b981' },
    { name: 'Travel & Fuel', count: 8, color: '#00f2fe' },
    { name: 'Utilities & Bills', count: 5, color: '#a855f7' },
    { name: 'Technology & Hardware', count: 4, color: '#3b82f6' },
    { name: 'Health & Medicine', count: 3, color: '#ec4899' },
  ]);
  const [newCatName, setNewCatName] = useState('');

  // Handle saving profile
  const handleSaveProfile = (e) => {
    e?.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      if (updateUserProfile) {
        updateUserProfile(form);
      } else if (setUserProfile) {
        setUserProfile(form);
      }

      try {
        localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(form));
      } catch (err) {}

      try {
        soundFx?.playSuccessChime?.();
      } catch (err) {}

      setSavedNotice(true);
      setTimeout(() => {
        setSavedNotice(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 350);
    }
  };

  // Handle custom photo upload with client-side canvas compression
  // to avoid localStorage QuotaExceededError
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
          soundFx.playClick();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle remove photo
  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: null }));
    soundFx.playClick();
  };

  // Add category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategoriesList((prev) => [
      ...prev,
      { name: newCatName.trim(), count: 0, color: '#00f2fe' },
    ]);
    setNewCatName('');
    soundFx.playSuccessChime();
  };

  const languages = [
    { code: 'en', name: 'English (US / Global)', flag: '🇺🇸' },
    { code: 'fil', name: 'Filipino / Tagalog (Resibo Mode)', flag: '🇵🇭' },
    { code: 'es', name: 'Español (América / España)', flag: '🇪🇸' },
    { code: 'ja', name: '日本語 (Japanese / レシート)', flag: '🇯🇵' },
  ];

  const currencies = [
    { code: 'PHP', name: 'Philippine Peso (₱)', symbol: '₱' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  ];

  // Approximate storage calculation (~200KB per receipt doc)
  const approxStorageMB = Math.max(documents.length * 0.2, 1.0).toFixed(1);

  return (
    <div className="view-page" style={{ width: '100%', padding: 0 }}>
      {/* 1. Header Section */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span className="liquid-badge liquid-badge-violet">
            <Settings size={13} /> {t.settings?.title || 'Settings'}
          </span>
        </div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          General Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Manage your profile, workspace, security, and privacy in one place.
        </p>
      </div>

      {/* Save Notification Toast */}
      {savedNotice && (
        <div
          style={{
            marginBottom: '14px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid rgba(0, 242, 254, 0.45)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={16} color="#00f2fe" />
          <span style={{ fontWeight: 600 }}>Profile settings successfully saved!</span>
        </div>
      )}

      {/* Main Settings Container (Liquid Glass Panel) */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Navigation Tabs Bar */}
        <div
          className="settings-tabs-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--glass-border)',
            padding: '0 20px',
            background: 'rgba(10, 16, 34, 0.45)',
          }}
        >
          {['Profile', 'Pipedream Auth', 'Categories', 'Security', 'Notifications'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  soundFx.playClick();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #00f2fe' : '2px solid transparent',
                  padding: '12px 20px',
                  color: isActive ? '#00f2fe' : 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textShadow: isActive ? '0 0 15px rgba(0, 242, 254, 0.6)' : 'none',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div style={{ padding: '20px 24px' }}>
          {/* TAB 1: PROFILE (Shown only when user is signed in, otherwise prompt sign in) */}
          {activeTab === 'Profile' && (
            <div>
              {!userProfile ? (
                /* Unauthenticated: Show Pipedream Sign In / Register Card */
                <PipedreamAuthCard onNavigateToSettings={() => setActiveTab('Pipedream Auth')} />
              ) : (
                /* Authenticated User: Show Profile Fields & Sign Out */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <h2
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          margin: 0,
                        }}
                      >
                        Profile Information
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Signed in as {userProfile.email}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="liquid-btn liquid-btn-secondary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      title="Sign Out of Resiboss"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  {/* Subtle glass line divider */}
                  <div
                    style={{
                      height: '1px',
                      background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.35), rgba(255, 255, 255, 0.1), transparent)',
                      marginBottom: '16px',
                    }}
                  />

                  {/* Avatar Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Profile Photo with Cyan Glass Ring */}
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#090d1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(0, 242, 254, 0.5)',
                        boxShadow: '0 0 16px rgba(0, 242, 254, 0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {form.photo ? (
                        <img
                          src={form.photo}
                          alt="User Avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                          }}
                        >
                          {(form.firstName || userProfile.firstName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Upload Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="liquid-btn liquid-btn-secondary"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                      }}
                    >
                      <Upload size={14} color="#00f2fe" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    {/* Remove Photo Button */}
                    {form.photo && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="liquid-btn liquid-btn-secondary"
                        style={{
                          padding: '7px 14px',
                          borderRadius: '10px',
                          fontSize: '0.84rem',
                        }}
                      >
                        <X size={14} color="var(--text-muted)" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Form Input Fields */}
                  <form onSubmit={handleSaveProfile}>
                    {/* Row 1: First Name & Last Name (2 Columns) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            display: 'block',
                            marginBottom: '6px',
                          }}
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          className="liquid-input"
                          value={form.firstName}
                          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                          style={{ padding: '9px 12px' }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            display: 'block',
                            marginBottom: '6px',
                          }}
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="liquid-input"
                          value={form.lastName}
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                          style={{ padding: '9px 12px' }}
                        />
                      </div>
                    </div>

                    {/* Row 2: Email Address */}
                    <div style={{ marginBottom: '18px' }}>
                      <label
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="liquid-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{ maxWidth: '49%', padding: '9px 12px' }}
                      />
                    </div>

                    {/* Save Profile Button (Bottom Right) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginTop: '12px' }}>
                      {savedNotice && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#10b981',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
                            animation: 'fadeIn 0.25s ease',
                          }}
                        >
                          <CheckCircle2 size={16} color="#10b981" />
                          <span>Profile saved successfully!</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="liquid-btn liquid-btn-primary"
                        style={{
                          padding: '10px 26px',
                          borderRadius: '10px',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          background: savedNotice
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : undefined,
                          borderColor: savedNotice ? '#10b981' : undefined,
                          color: savedNotice ? '#ffffff' : undefined,
                          boxShadow: savedNotice
                            ? '0 0 20px rgba(16, 185, 129, 0.6)'
                            : undefined,
                          transition: 'all 0.3s ease',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {savedNotice ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Saved!</span>
                          </>
                        ) : isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB: PIPEDREAM AUTH */}
          {activeTab === 'Pipedream Auth' && (
            <div>
              <PipedreamSetupTab />
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'Categories' && (
            <div>
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '16px',
                }}
              >
                Receipt Expense Categories
              </h2>
              <div
                style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.35), rgba(255, 255, 255, 0.1), transparent)',
                  marginBottom: '26px',
                }}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '16px',
                  marginBottom: '26px',
                }}
              >
                {categoriesList.map((cat, idx) => (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(10, 15, 30, 0.45)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: cat.color,
                          boxShadow: `0 0 10px ${cat.color}`,
                        }}
                      />
                      <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="liquid-badge liquid-badge-cyan" style={{ fontSize: '0.72rem' }}>
                      {cat.count} files
                    </span>
                  </div>
                ))}
              </div>

              {/* Add category form */}
              <form
                onSubmit={handleAddCategory}
                style={{ display: 'flex', gap: '12px', maxWidth: '520px' }}
              >
                <input
                  type="text"
                  placeholder="New category name (e.g. Subscriptions)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="liquid-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="liquid-btn liquid-btn-primary"
                  style={{ borderRadius: '12px' }}
                >
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'Security' && (
            <div>
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '16px',
                }}
              >
                Security & Active Sessions
              </h2>
              <div
                style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.35), rgba(255, 255, 255, 0.1), transparent)',
                  marginBottom: '22px',
                }}
              />

              {/* Security & Storage Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                {/* Metric 1: Active Sessions */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'rgba(10, 15, 30, 0.45)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      ACTIVE SESSIONS
                    </span>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: userProfile ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                        color: userProfile ? '#34d399' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: userProfile ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <Laptop size={15} />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: userProfile ? '#34d399' : '#ffffff',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {userProfile ? '1 (Online)' : '1 (Guest)'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Primary browser authenticated session
                  </div>
                </div>

                {/* Metric 2: Approx Vault Storage */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'rgba(10, 15, 30, 0.45)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      VAULT STORAGE
                    </span>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.12)',
                        color: '#c084fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                      }}
                    >
                      <HardDrive size={15} />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {approxStorageMB} MB
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {documents.length} receipts stored in browser vault
                  </div>
                </div>
              </div>

              {/* Active Session Info Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                  background: 'rgba(10, 15, 30, 0.45)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(0, 242, 254, 0.12)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00f2fe',
                    }}
                  >
                    <Laptop size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 600, color: '#ffffff' }}>
                      Windows PC • Chrome Browser
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Localhost:3000 • Current Session Active
                    </div>
                  </div>
                </div>
                <span className="liquid-badge liquid-badge-emerald">
                  Active Now
                </span>
              </div>

              {/* Data Vault Wipe */}
              <div
                style={{
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '20px',
                  display: 'flex',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Wipe all stored receipts from your local browser vault?')) {
                      clearAllData();
                      soundFx.playClick();
                      alert('Vault data cleared.');
                    }
                  }}
                  className="liquid-btn liquid-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={16} /> Clear Vault Storage
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & PREFERENCES */}
          {activeTab === 'Notifications' && (
            <div>
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '16px',
                }}
              >
                System Preferences & Audio FX
              </h2>
              <div
                style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.35), rgba(255, 255, 255, 0.1), transparent)',
                  marginBottom: '26px',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Language & Currency Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Interface Language
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {languages.map((l) => (
                        <div
                          key={l.code}
                          onClick={() => {
                            setLanguage(l.code);
                            soundFx.playClick();
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: language === l.code ? 'rgba(0, 242, 254, 0.14)' : 'rgba(10, 15, 30, 0.45)',
                            border: language === l.code ? '1px solid #00f2fe' : '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.88rem',
                            fontWeight: language === l.code ? 600 : 400,
                            color: language === l.code ? '#ffffff' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{l.flag}</span>
                          <span>{l.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Vault Default Currency
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {currencies.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setCurrency(c.code);
                            soundFx.playClick();
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: currency === c.code ? 'rgba(168, 85, 247, 0.16)' : 'rgba(10, 15, 30, 0.45)',
                            border: currency === c.code ? '1px solid #a855f7' : '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.88rem',
                            fontWeight: currency === c.code ? 600 : 400,
                            color: currency === c.code ? '#ffffff' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span>{c.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#c084fc' }}>
                            {c.symbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sound FX Toggle */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '18px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff' }}>
                      Audio Sound Effects
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Synthesized scanner laser hums, blips, and success chimes
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => {
                      setSettings({ ...settings, soundEnabled: e.target.checked });
                      if (e.target.checked) soundFx.playSuccessChime();
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#00f2fe',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* 3D Tilt Physics Toggle */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff' }}>
                      3D Fluid Tilt Physics
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Cards physically tilt towards cursor with specular light refraction
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enable3DTilt}
                    onChange={(e) =>
                      setSettings({ ...settings, enable3DTilt: e.target.checked })
                    }
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#00f2fe',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
