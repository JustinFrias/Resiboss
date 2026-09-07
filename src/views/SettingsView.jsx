import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/soundEffects';
import { PipedreamAuthCard } from '../components/PipedreamAuthCard';
import {
  Upload,
  X,
  CheckCircle2,
  Save,
  Loader2,
  LogOut,
} from 'lucide-react';

export const SettingsView = () => {
  const {
    userProfile,
    setUserProfile,
    updateUserProfile,
    signOut,
    t,
  } = useApp();

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

  const handleSignOut = async () => {
    soundFx.playClick();
    if (signOut) {
      await signOut();
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef(null);

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

  return (
    <div className="view-page" style={{ width: '100%', padding: 0 }}>
      {/* 1. Header Section */}
      <div style={{ marginBottom: '14px' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          {t.settings.generalTitle}
        </h1>
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
          <span style={{ fontWeight: 600 }}>{t.settings.savedAlert}</span>
        </div>
      )}

      {/* Main Settings Container (Liquid Glass Panel) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {!userProfile ? (
                /* Unauthenticated: Show Sign In / Register Card */
                <PipedreamAuthCard />
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
                        {t.settings.profileInfo}
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
                      <span>{t.settings.signOut}</span>
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
                            <span>{t.settings.saveProfile}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
      </div>
    </div>
  );
};
