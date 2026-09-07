import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/soundEffects';
import { PipedreamAuthCard } from '../components/PipedreamAuthCard';
import {
  Sliders,
  User,
  Sun,
  Moon,
  Bell,
  Mail,
  Tag,
  ShieldCheck,
  Upload,
  Maximize2,
  Trash2,
  Sparkles,
  X,
  CheckCircle2,
  Save,
  Loader2,
  LogOut,
  FileText,
  Volume2,
  VolumeX,
  AlertCircle,
  Database,
  Check,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'av-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Violet Persona' },
  { id: 'av-2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Tech Pro' },
  { id: 'av-3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', label: 'Crimson Glow' },
  { id: 'av-4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', label: 'Executive' },
  { id: 'av-5', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', label: 'Cyber Teal' },
  { id: 'av-6', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', label: 'Creative Wavy' },
  { id: 'av-7', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', label: 'Studio Noir' },
  { id: 'av-8', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', label: 'Classic Monochrome' },
];

const BORDER_PRESETS = [
  { id: 'cyan', label: 'Neon Cyan', color: '#00f2fe', glow: 'rgba(0, 242, 254, 0.55)' },
  { id: 'purple', label: 'Electric Violet', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.55)' },
  { id: 'emerald', label: 'Emerald Green', color: '#10b981', glow: 'rgba(16, 185, 129, 0.55)' },
  { id: 'amber', label: 'Gold Amber', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.55)' },
  { id: 'rose', label: 'Cyber Rose', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.55)' },
  { id: 'slate', label: 'Titanium Slate', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)' },
];

export const SettingsView = () => {
  const {
    userProfile,
    setUserProfile,
    updateUserProfile,
    signOut,
    t,
    setIsTermsOpen,
    setActiveTab,
    theme,
    toggleTheme,
    settings,
    setSettings,
    documents,
    clearAllData,
  } = useApp();

  const [activeSettingTab, setActiveSettingTab] = useState('profile');
  const [showZoom, setShowZoom] = useState(false);

  const [form, setForm] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    email: userProfile?.email || '',
    photo: userProfile?.photo || null,
    borderStyle: userProfile?.borderStyle || 'cyan',
    zoom: userProfile?.zoom || 1,
  });

  // Sync form state whenever userProfile changes
  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        photo: userProfile.photo || null,
        borderStyle: userProfile.borderStyle || 'cyan',
        zoom: userProfile.zoom || 1,
      });
    }
  }, [userProfile]);

  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef(null);

  const currentBorder =
    BORDER_PRESETS.find((b) => b.id === form.borderStyle) || BORDER_PRESETS[0];

  const handleSignOut = async () => {
    soundFx.playClick();
    if (signOut) {
      await signOut();
    }
  };

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

      soundFx?.playSuccessChime?.();
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

  // Upload Photo with Canvas Compression to ensure localStorage quota safety
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

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: null }));
    soundFx.playClick();
  };

  const handleSelectPreset = (url) => {
    soundFx.playClick();
    setForm((prev) => ({ ...prev, photo: url }));
  };

  const handleSelectBorder = (borderId) => {
    soundFx.playClick();
    setForm((prev) => ({ ...prev, borderStyle: borderId }));
  };

  const navTabs = [
    { id: 'profile', label: 'My Profile & Avatar', icon: User },
    { id: 'theme', label: 'Appearance & Theme', icon: Sun },
    { id: 'alerts', label: 'In-App Alerts', icon: Bell },
    { id: 'email', label: 'Email Updates', icon: Mail },
    { id: 'labels', label: 'Custom Labels', icon: Tag },
    { id: 'privacy', label: 'Privacy & Storage', icon: ShieldCheck },
  ];

  return (
    <div className="view-page" style={{ width: '100%', padding: '0 4px', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header Row (Matching User Screenshot) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(37, 99, 235, 0.16)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
              flexShrink: 0,
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Preferences & Settings
            </h1>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                margin: '2px 0 0 0',
              }}
            >
              Configure your profile avatar, workspace preferences, and security
            </p>
          </div>
        </div>

        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveTab('dashboard');
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Back to Dashboard"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Container Card (Two Columns) */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 15, 30, 0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(0, 242, 254, 0.08)',
          overflow: 'hidden',
          minHeight: '640px',
        }}
      >
        {/* Left Side Navigation Menu */}
        <div
          style={{
            width: '235px',
            borderRight: '1px solid rgba(255, 255, 255, 0.07)',
            padding: '18px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.22)',
            flexShrink: 0,
          }}
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setActiveSettingTab(tab.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: isActive
                    ? '1px solid rgba(56, 189, 248, 0.35)'
                    : '1px solid transparent',
                  background: isActive ? 'rgba(30, 58, 138, 0.38)' : 'transparent',
                  color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={17} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Content Area */}
        <div
          style={{
            flex: 1,
            padding: '24px 28px',
            overflowY: 'auto',
          }}
        >
          {/* TAB 1: My Profile & Avatar */}
          {activeSettingTab === 'profile' && (
            <div>
              {!userProfile ? (
                <PipedreamAuthCard />
              ) : (
                <form onSubmit={handleSaveProfile}>
                  {/* Heading & Subtitle */}
                  <div style={{ marginBottom: '18px' }}>
                    <h2
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: '0 0 4px 0',
                      }}
                    >
                      Profile Photo & Information
                    </h2>
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                      }}
                    >
                      Customize how your profile appears across boards, cards, and team comments.
                    </p>
                  </div>

                  {/* Profile Photo Box (Matching Screenshot) */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      {/* Avatar Circle with Dynamic Border Glow */}
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          border: `2.5px solid ${currentBorder.color}`,
                          boxShadow: `0 0 18px ${currentBorder.glow}`,
                          background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {form.photo ? (
                          <img
                            src={form.photo}
                            alt="Profile"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transform: `scale(${form.zoom || 1})`,
                              transition: 'transform 0.15s ease',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
                            {(form.firstName || userProfile.firstName || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Photo Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {/* 1. Upload Image File */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              background: '#2563eb',
                              border: '1px solid #3b82f6',
                              borderRadius: '10px',
                              padding: '8px 16px',
                              color: '#ffffff',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
                          >
                            <Upload size={15} />
                            <span>Upload Image File</span>
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />

                          {/* 2. Adjust & Zoom */}
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setShowZoom(!showZoom);
                            }}
                            style={{
                              background: showZoom ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                              border: showZoom ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              color: showZoom ? '#00f2fe' : '#ffffff',
                              fontSize: '0.84rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Maximize2 size={15} />
                            <span>Adjust & Zoom</span>
                          </button>

                          {/* 3. Remove Photo */}
                          {form.photo && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                color: '#f87171',
                                fontSize: '0.84rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                            >
                              <Trash2 size={15} />
                              <span>Remove Photo</span>
                            </button>
                          )}
                        </div>

                        {/* Helper text */}
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Supports PNG, JPG, GIF, or WebP (max 3MB). Replaces Google photo if signed in with Google.
                        </div>

                        {/* Interactive Zoom Slider */}
                        {showZoom && (
                          <div
                            style={{
                              marginTop: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              maxWidth: '340px',
                              animation: 'fadeIn 0.2s ease',
                            }}
                          >
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Scale:</span>
                            <input
                              type="range"
                              min="1"
                              max="2"
                              step="0.05"
                              value={form.zoom || 1}
                              onChange={(e) => setForm({ ...form, zoom: parseFloat(e.target.value) })}
                              style={{ flex: 1, accentColor: '#00f2fe', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00f2fe', width: '40px' }}>
                              {Math.round((form.zoom || 1) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Curated Preset Avatars Row */}
                  <div style={{ marginBottom: '22px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '12px',
                      }}
                    >
                      <Sparkles size={16} color="#00f2fe" />
                      <span>Or choose a stylish 3D avatar:</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '6px',
                      }}
                    >
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = form.photo === av.url;
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => handleSelectPreset(av.url)}
                            title={av.label}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              padding: 0,
                              border: isSelected
                                ? '2.5px solid #00f2fe'
                                : '2px solid rgba(255, 255, 255, 0.15)',
                              boxShadow: isSelected
                                ? '0 0 14px rgba(0, 242, 254, 0.7)'
                                : 'none',
                              transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              background: '#0a0f24',
                              flexShrink: 0,
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#00f2fe';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            <img
                              src={av.url}
                              alt={av.label}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Profile Border Style Section */}
                  <div style={{ marginBottom: '22px' }}>
                    <h3
                      style={{
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: '0 0 2px 0',
                      }}
                    >
                      Profile Border Style
                    </h3>
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      Choose a border to display around your avatar — useful for IT role identification or personal flair.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {BORDER_PRESETS.map((bp) => {
                        const isSelected = form.borderStyle === bp.id;
                        return (
                          <button
                            key={bp.id}
                            type="button"
                            onClick={() => handleSelectBorder(bp.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 14px',
                              borderRadius: '10px',
                              border: isSelected
                                ? `1.5px solid ${bp.color}`
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isSelected
                                ? `rgba(${bp.id === 'cyan' ? '0, 242, 254' : bp.id === 'purple' ? '168, 85, 247' : bp.id === 'emerald' ? '16, 185, 129' : bp.id === 'amber' ? '245, 158, 11' : bp.id === 'rose' ? '244, 63, 94' : '148, 163, 184'}, 0.14)`
                                : 'rgba(255, 255, 255, 0.03)',
                              color: isSelected ? bp.color : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              boxShadow: isSelected ? `0 0 12px ${bp.glow}` : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: bp.color,
                                boxShadow: `0 0 6px ${bp.color}`,
                              }}
                            />
                            <span>{bp.label}</span>
                            {isSelected && <Check size={13} color={bp.color} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Profile Details Inputs (First Name, Last Name, Email) */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: '0.8rem',
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
                          style={{ width: '100%', padding: '9px 12px' }}
                          placeholder="e.g. Justin"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: '0.8rem',
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
                          style={{ width: '100%', padding: '9px 12px' }}
                          placeholder="e.g. Frias"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: '0.8rem',
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
                        style={{ width: '100%', padding: '9px 12px' }}
                        placeholder="e.g. justinfrias951@gmail.com"
                      />
                    </div>
                  </div>

                  {/* Save Feedback Notice */}
                  {savedNotice && (
                    <div
                      style={{
                        marginBottom: '14px',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
                        animation: 'fadeIn 0.25s ease',
                      }}
                    >
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Profile & avatar preferences saved successfully!</span>
                    </div>
                  )}

                  {/* Footer Actions: Terms Link (Left) & Save / Sign Out (Right) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '16px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        soundFx?.playClick?.();
                        setIsTermsOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 0',
                        textDecoration: 'underline',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#00f2fe')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <FileText size={15} />
                      <span>Terms & Conditions</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '9px 18px',
                          borderRadius: '10px',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                          background: savedNotice
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '9px 24px',
                          borderRadius: '10px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 18px rgba(0, 242, 254, 0.45)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : savedNotice ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Appearance & Theme */}
          {activeSettingTab === 'theme' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                  Appearance & Theme
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Customize the interface theme, visual effects, and audio feedback.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Theme Mode</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Current: {theme === 'dark' ? 'Dark Futuristic Cyber' : 'Clean Pearl Light'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: theme === 'dark' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      border: theme === 'dark' ? '1px solid #c084fc' : '1px solid #f59e0b',
                      color: theme === 'dark' ? '#c084fc' : '#f59e0b',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
                  </button>
                </div>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Audio & UI Sound Effects</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Play subtle tactile audio cues on button clicks and scans.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: settings.soundEnabled ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                      border: settings.soundEnabled ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: settings.soundEnabled ? '#00f2fe' : 'var(--text-muted)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span>{settings.soundEnabled ? 'Enabled' : 'Muted'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: In-App Alerts */}
          {activeSettingTab === 'alerts' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                  In-App Alerts
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Manage instant toasts, push badges, and document status notifications.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {[
                  { title: 'Receipt OCR Scan Complete', desc: 'Notify immediately when an image is processed via OCR.' },
                  { title: 'Tax & BIR Compliance Alerts', desc: 'Send reminders for quarterly and annual tax computation.' },
                  { title: 'Excel / CSV Journal Export Ready', desc: 'Alert when batch downloads are ready for download.' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10b981',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                      }}
                    >
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Email Updates */}
          {activeSettingTab === 'email' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                  Email Updates
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Configure email summaries and expense report dispatches.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Registered Email: <span style={{ color: '#00f2fe', fontWeight: 700 }}>{userProfile?.email || 'justinfrias951@gmail.com'}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Weekly transaction digests and monthly tax summaries will be delivered to this verified mailbox.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Custom Labels */}
          {activeSettingTab === 'labels' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                  Custom Labels & Categories
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Manage expense tags automatically detected during receipt scanning.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { name: 'Food & Dining', color: '#f59e0b' },
                  { name: 'Groceries & Supplies', color: '#10b981' },
                  { name: 'Utilities & Bills', color: '#3b82f6' },
                  { name: 'Transportation & Fuel', color: '#a855f7' },
                  { name: 'Office Equipment', color: '#00f2fe' },
                  { name: 'Medical & Health', color: '#f43f5e' },
                ].map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: cat.color,
                        boxShadow: `0 0 8px ${cat.color}`,
                      }}
                    />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Privacy & Storage */}
          {activeSettingTab === 'privacy' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                  Privacy & Storage
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Inspect local vault cache, receipt storage, and privacy controls.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={18} color="#00f2fe" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                        Local Vault Receipts
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Currently stored: {documents?.length || 0} receipt documents
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all local demo receipts and cache?')) {
                        clearAllData();
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Vault Cache
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
