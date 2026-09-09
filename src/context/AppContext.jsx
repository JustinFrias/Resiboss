import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialReceipts } from '../utils/initialData';
import { translations } from '../utils/i18n';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  supabase,
  isSupabaseConfigured,
  syncReceiptToSupabase,
  deleteReceiptFromSupabase,
  fetchReceiptsFromSupabase,
  mapSupabaseToDoc,
} from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

const AppContext = createContext();

const STORAGE_KEY = 'resiboss_receipts_v1';
const SETTINGS_KEY = 'resiboss_settings_v1';

const currencyRates = {
  PHP: { symbol: '₱', rate: 1, locale: 'en-PH' },
  USD: { symbol: '$', rate: 0.018, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.0165, locale: 'de-DE' },
  JPY: { symbol: '¥', rate: 2.75, locale: 'ja-JP' },
  GBP: { symbol: '£', rate: 0.014, locale: 'en-GB' },
};

const DEMO_RECEIPT_IDS = new Set([
  'REC-2026-001',
  'REC-2026-002',
  'REC-2026-003',
  'REC-2026-004',
  'REC-2026-005',
]);

export const SESSION_PROFILE_KEY = 'resiboss_session_profile_v1';
export const CUSTOM_PROFILES_MAP_KEY = 'resiboss_saved_custom_profiles_v1';

/**
 * Retrieve saved profile customizations (First Name, Last Name, Avatar Photo, Border Style, Zoom)
 * keyed by the user's email or account ID.
 */
export const getSavedCustomProfile = (emailOrId) => {
  if (!emailOrId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOM_PROFILES_MAP_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const key = String(emailOrId).trim().toLowerCase();
    return map[key] || null;
  } catch (e) {
    return null;
  }
};

/**
 * Persists user's customized profile data to localStorage keyed by email and/or ID,
 * ensuring saved changes survive log out and log in cycles.
 */
export const saveCustomProfileToStorage = (emailOrId, customData) => {
  if (!emailOrId || !customData || typeof window === 'undefined') return;
  try {
    const key = String(emailOrId).trim().toLowerCase();
    const raw = localStorage.getItem(CUSTOM_PROFILES_MAP_KEY);
    const map = raw ? JSON.parse(raw) : {};
    
    // Merge only defined profile custom preferences
    const existing = map[key] || {};
    const updated = {
      ...existing,
      firstName: customData.firstName !== undefined ? customData.firstName : existing.firstName,
      lastName: customData.lastName !== undefined ? customData.lastName : existing.lastName,
      photo: customData.photo !== undefined ? customData.photo : existing.photo,
      borderStyle: customData.borderStyle || existing.borderStyle || 'cyan',
      zoom: typeof customData.zoom === 'number' ? customData.zoom : (existing.zoom || 1),
      savedAt: Date.now(),
    };
    map[key] = updated;
    localStorage.setItem(CUSTOM_PROFILES_MAP_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to persist custom profile to localStorage:', e);
  }
};

/**
 * Merges raw auth session user data with user-saved customizations.
 */
export const buildUserProfile = (user, fallbackProvider = 'google') => {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const email = (user.email || meta.email || '').trim().toLowerCase();
  const id = user.id;

  // Retrieve saved customizations for this account
  const localSaved = (email ? getSavedCustomProfile(email) : null) || (id ? getSavedCustomProfile(id) : null) || {};
  const cloudSaved = meta.custom_profile || {};
  const custom = { ...cloudSaved, ...localSaved };

  const firstName = custom.firstName !== undefined && custom.firstName !== ''
    ? custom.firstName
    : (meta.given_name || meta.full_name?.split(' ')[0] || email.split('@')[0] || 'User');

  const lastName = custom.lastName !== undefined && custom.lastName !== ''
    ? custom.lastName
    : (meta.family_name || meta.full_name?.split(' ').slice(1).join(' ') || '');

  const photo = custom.photo !== undefined
    ? custom.photo
    : (meta.avatar_url || meta.picture || null);

  const borderStyle = custom.borderStyle || 'cyan';
  const zoom = typeof custom.zoom === 'number' ? custom.zoom : 1;

  return {
    id: id || `user_${Date.now()}`,
    firstName,
    lastName,
    email: email || user.email || '',
    photo,
    borderStyle,
    zoom,
    authProvider: fallbackProvider,
    isAuthSession: true,
  };
};

/**
 * Returns a user-partitioned local storage key for receipts so accounts never share data.
 */
export const getUserReceiptsStorageKey = (profile) => {
  if (!profile) return 'resiboss_receipts_guest_v1';
  const tag = (profile.email || profile.id || 'guest')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  return `resiboss_receipts_user_${tag}`;
};

/**
 * Recovers the active authenticated user profile from sessionStorage if available.
 */
export const getInitialUserProfile = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resiboss_user_profile_v1');
      const saved = sessionStorage.getItem(SESSION_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthSession) {
          const email = parsed.email;
          const custom = (email ? getSavedCustomProfile(email) : null) || (parsed.id ? getSavedCustomProfile(parsed.id) : null);
          if (custom) {
            return { ...parsed, ...custom };
          }
          return parsed;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  // Real Supabase User State (null when user is NOT signed in)
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(getInitialUserProfile);
  const userProfileRef = useRef(userProfile);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  const [documents, setDocuments] = useState(() => {
    try {
      const initialUser = getInitialUserProfile();
      if (!initialUser) return [];
      const storageKey = getUserReceiptsStorageKey(initialUser);
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((doc) => !DEMO_RECEIPT_IDS.has(doc.id));
    } catch (e) {
      return [];
    }
  });

  // Keep documents in sync with the active authenticated user account
  useEffect(() => {
    if (!userProfile) {
      setDocuments([]);
      setInspectingDoc(null);
      return;
    }

    const storageKey = getUserReceiptsStorageKey(userProfile);
    let cached = [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          cached = parsed.filter((doc) => !DEMO_RECEIPT_IDS.has(doc.id));
        }
      }
    } catch (e) {}

    setDocuments(cached);

    if (supabase && isSupabaseConfigured) {
      fetchReceiptsFromSupabase(userProfile).then(({ data }) => {
        if (Array.isArray(data)) {
          const liveDocs = data.map(mapSupabaseToDoc);
          setDocuments(liveDocs);
          try {
            localStorage.setItem(storageKey, JSON.stringify(liveDocs));
          } catch (e) {}
        }
      });
    }
  }, [userProfile?.id, userProfile?.email]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('PHP');
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('resiboss_language_v1') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('resiboss_language_v1', lang);
    } catch (e) {}
  };
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(() => {
    try {
      return localStorage.getItem('resiboss_terms_accepted_v1') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  const [cookieConsent, setCookieConsentState] = useState(() => {
    try {
      const saved = localStorage.getItem('resiboss_cookie_consent_v1');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const saveCookieConsent = (consent) => {
    setCookieConsentState(consent);
    try {
      localStorage.setItem('resiboss_cookie_consent_v1', JSON.stringify(consent));
    } catch (e) {}
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : {
        glowIntensity: 1.0,
        fluidSpeed: 1.0,
        enable3DTilt: true,
        soundEnabled: true,
      };
    } catch (e) {
      return {
        glowIntensity: 1.0,
        fluidSpeed: 1.0,
        enable3DTilt: true,
        soundEnabled: true,
      };
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('resiboss_theme_v1') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('resiboss_notifications_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('resiboss_theme_v1', theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('resiboss_notifications_v1', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  const toggleTheme = () => {
    soundFx.playClick();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const markNotificationAsRead = (id) => {
    soundFx.playClick();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    soundFx.playClick();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (notif) => {
    const item = {
      id: notif.id || `notif-${Date.now()}`,
      title: notif.title || 'Notification',
      desc: notif.desc || '',
      time: notif.time || 'Just now',
      read: false,
      type: notif.type || 'info',
      targetTab: notif.targetTab || 'dashboard',
      ...notif,
    };
    setNotifications((prev) => [item, ...prev]);
    return item;
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('resiboss_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleSidebar = () => {
    soundFx.playClick();
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('resiboss_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const clearNotifications = () => {
    soundFx?.playClick?.();
    setNotifications([]);
    try {
      localStorage.removeItem('resiboss_notifications_v1');
    } catch (e) {}
  };

  // Listen for Supabase Authentication State (Google OAuth)
  useEffect(() => {
    if (!supabase) return;

    // Check existing active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const profile = buildUserProfile(session.user, 'google');
        setUserProfile(profile);
        try {
          sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {}
      }
      // Note: If session is null, do NOT wipe userProfile because user may be logged in via Pipedream or Guest mode.
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const provider = session.user.app_metadata?.provider || 'email';
        const profile = buildUserProfile(session.user, provider);
        setUserProfile(profile);
        try {
          sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {}
      } else if (event === 'SIGNED_OUT') {
        // Clear profile on sign out
        setUserProfile((prev) => {
          try {
            sessionStorage.removeItem(SESSION_PROFILE_KEY);
          } catch (e) {}
          return null;
        });
        setCurrentUser(null);
        setDocuments([]);
        setInspectingDoc(null);
      }
    });

    let appUrlListener;
    if (Capacitor.isNativePlatform() || typeof window !== 'undefined') {
      appUrlListener = App.addListener('appUrlOpen', async (event) => {
        const url = event.url;
        if (!url) return;

        // Auto close in-app browser immediately upon receiving deep link
        try {
          if (Capacitor.isPluginAvailable('Browser')) {
            await Browser.close();
          }
        } catch (e) {}

        if (url.includes('com.resiboss.app://') || url.includes('resiboss.vercel.app')) {
          // 1. PKCE Code Exchange Flow (?code=...)
          const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
          const queryParams = new URLSearchParams(queryPart);
          const code = queryParams.get('code');

          if (code && supabase) {
            try {
              const { data } = await supabase.auth.exchangeCodeForSession(code);
              if (data?.session?.user) return;
            } catch (err) {
              console.warn('PKCE exchange error:', err);
            }
          }

          // 2. Implicit Access Token Flow (#access_token=...)
          const hashPart = url.includes('#') ? url.split('#')[1] : queryPart;
          const params = new URLSearchParams(hashPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresIn = params.get('expires_in');

          if (accessToken && refreshToken && supabase) {
            try {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: Number(expiresIn) || 3600,
                token_type: 'bearer',
              });
            } catch (err) {
              console.warn('Set session error:', err);
            }
          }
        }
      });
    }

    return () => {
      subscription?.unsubscribe();
      appUrlListener?.then((l) => l.remove?.());
    };
  }, []);

  // Real-time Database Sync & Live Supabase Subscriptions (account-isolated)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    // Subscribe to REALTIME changes (INSERT, UPDATE, DELETE) for the active user account
    const channel = supabase
      .channel('public:receipts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts' },
        (payload) => {
          const currentProf = userProfileRef.current;
          if (!currentProf) return;

          const currentUserId = currentProf.id;
          const currentUserEmail = (currentProf.email || '').trim().toLowerCase();

          const isOurDoc = (row) => {
            if (!row) return false;
            const rowUserId = row.user_id;
            const rowEmail = (row.user_email || '').trim().toLowerCase();

            if (rowUserId && currentUserId && rowUserId === currentUserId) return true;
            if (rowEmail && currentUserEmail && rowEmail === currentUserEmail) return true;
            return false;
          };

          if (payload.eventType === 'INSERT') {
            if (isOurDoc(payload.new)) {
              const newDoc = mapSupabaseToDoc(payload.new);
              setDocuments((prev) => {
                if (prev.some((d) => d.id === newDoc.id)) return prev;
                return [newDoc, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            if (isOurDoc(payload.new)) {
              const updatedDoc = mapSupabaseToDoc(payload.new);
              setDocuments((prev) =>
                prev.map((d) => (d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isTermsAccepted) {
      setIsTermsOpen(true);
      throw new Error(
        language === 'fil'
          ? 'Kailangang basahin at tanggapin muna ang Terms and Conditions bago mag-sign in gamit ang Google.'
          : 'Please read and accept the Terms & Conditions before continuing with Google.'
      );
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const isNative = Capacitor.isNativePlatform();

    // On native mobile app, request deep link return to com.resiboss.app
    const redirectTo = isNative
      ? 'com.resiboss.app://auth/callback'
      : (typeof window !== 'undefined' ? window.location.origin : 'https://resiboss.vercel.app');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });

    if (error) throw error;

    if (!data?.url) {
      throw new Error('Walang natanggap na Google sign-in URL.');
    }

    if (isNative) {
      // Try in-app Browser plugin if available in native runtime
      if (Capacitor.isPluginAvailable('Browser')) {
        try {
          await Browser.open({
            url: data.url,
            windowName: '_blank',
          });
          return data;
        } catch (browserErr) {
          console.warn('Browser.open failed, falling back to window.location:', browserErr);
        }
      }
    }

    // Direct redirection for web & fallback environments
    window.location.assign(data.url);
    return data;
  };

  const signInWithEmail = async (email, password) => {
    if (!isTermsAccepted) {
      setIsTermsOpen(true);
      throw new Error(
        language === 'fil'
          ? 'Kailangang basahin at tanggapin muna ang Terms and Conditions bago mag-sign in.'
          : 'Please read and accept the Terms & Conditions before continuing.'
      );
    }

    if (!email || !password) {
      throw new Error(language === 'fil' ? 'Pakilagay ang email at password.' : 'Please enter your email and password.');
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error(language === 'fil' ? 'Maling email o password.' : 'Invalid email or password.');
      }
      throw error;
    }
    return data;
  };

  const signUpWithEmail = async (email, password) => {
    if (!isTermsAccepted) {
      setIsTermsOpen(true);
      throw new Error(
        language === 'fil'
          ? 'Kailangang basahin at tanggapin muna ang Terms and Conditions bago mag-sign in.'
          : 'Please read and accept the Terms & Conditions before continuing.'
      );
    }

    if (!email || !password) {
      throw new Error(language === 'fil' ? 'Pakilagay ang email at password.' : 'Please enter your email and password.');
    }

    if (password.length < 6) {
      throw new Error(language === 'fil' ? 'Ang password ay dapat hindi bababa sa 6 characters.' : 'Password must be at least 6 characters.');
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const resetPasswordForEmail = async (email) => {
    if (!email) {
      throw new Error(language === 'fil' ? 'Pakilagay ang iyong email address.' : 'Please enter your email address.');
    }
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    setCurrentUser(null);
    setUserProfile(null);
    setDocuments([]);
    setInspectingDoc(null);
    try {
      sessionStorage.removeItem(SESSION_PROFILE_KEY);
      localStorage.removeItem('resiboss_user_profile_v1');
    } catch (e) {}
  };

  const deleteAccount = async () => {
    const targetUserId = currentUser?.id || userProfile?.id;
    const targetEmail = currentUser?.email || userProfile?.email;

    if (supabase && (targetUserId || currentUser)) {
      // 1. Attempt token refresh if session exists
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && supabase.auth.refreshSession) {
          await supabase.auth.refreshSession();
        }
      } catch (e) {
        console.warn('Session refresh check note:', e);
      }

      // 2. Call delete_user_account RPC
      let rpcError = null;
      try {
        // Try with user_id_to_delete parameter first
        const res = await supabase.rpc('delete_user_account', {
          user_id_to_delete: targetUserId || '',
        });

        if (res.error) {
          // If the parameter wasn't found (older SQL version), try zero-param call
          if (res.error.code === 'PGRST202') {
            const fallbackRes = await supabase.rpc('delete_user_account');
            if (fallbackRes.error) {
              rpcError = fallbackRes.error;
            }
          } else {
            rpcError = res.error;
          }
        }
      } catch (callErr) {
        rpcError = callErr;
      }

      if (rpcError) {
        console.error('Supabase delete_user_account failed:', rpcError);
        throw new Error(
          rpcError.message ||
          'Hindi mabura ang account sa Supabase. Pakitiyak na maayos ang koneksyon o na-execute ang delete_user_account SQL sa Supabase SQL Editor.'
        );
      }
    }

    clearNotifications();
    clearAllData();

    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {}

    await signOut();
  };

  // Supabase Edge Function Invoker
  const invokeEdgeFunction = async (functionName, body = {}) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });
    if (error) {
      console.warn(`Edge function '${functionName}' error:`, error.message);
      throw error;
    }
    return data;
  };

  const updateUserProfile = (updatedProfile) => {
    setUserProfile((prev) => {
      const merged = { ...prev, ...updatedProfile, isAuthSession: true };
      const targetEmail = (merged.email || prev?.email || currentUser?.email || '').trim().toLowerCase();
      const targetId = merged.id || prev?.id || currentUser?.id;

      const customPayload = {
        firstName: merged.firstName,
        lastName: merged.lastName,
        photo: merged.photo,
        borderStyle: merged.borderStyle,
        zoom: merged.zoom,
      };

      if (targetEmail) {
        saveCustomProfileToStorage(targetEmail, customPayload);
      }
      if (targetId) {
        saveCustomProfileToStorage(targetId, customPayload);
      }

      try {
        sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(merged));
        localStorage.removeItem('resiboss_user_profile_v1');
      } catch (err) {
        console.warn('SessionStorage warning for profile:', err);
      }

      // Sync to Supabase user_metadata if available
      if (supabase && (currentUser || merged.id)) {
        try {
          supabase.auth.updateUser({
            data: {
              custom_profile: customPayload,
            },
          }).catch((e) => console.warn('Supabase profile sync warning:', e));
        } catch (e) {}
      }

      return merged;
    });
  };

  useEffect(() => {
    soundFx.enabled = settings.soundEnabled;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      if (userProfile) {
        const storageKey = getUserReceiptsStorageKey(userProfile);
        localStorage.setItem(storageKey, JSON.stringify(documents));
      }
    } catch (e) {}
  }, [documents, userProfile]);

  const t = translations[language] || translations.en;

  const formatCurrency = (amountInPHP) => {
    const info = currencyRates[currency] || currencyRates.PHP;
    const converted = amountInPHP * info.rate;
    
    // Formatting with currency symbol
    return `${info.symbol}${converted.toLocaleString(info.locale, {
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    })}`;
  };

  const addDocument = (newDoc) => {
    const completeDoc = {
      ...newDoc,
      id: newDoc.id || `REC-${new Date().getFullYear()}-${String(documents.length + 1).padStart(3, '0')}`,
      userId: userProfile?.id || null,
      userEmail: userProfile?.email || null,
      date: newDoc.date || new Date().toISOString().split('T')[0],
      time: newDoc.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: newDoc.status || 'Verified',
      currency: 'PHP',
      color: newDoc.color || '#00f2fe'
    };

    setDocuments((prev) => [completeDoc, ...prev]);
    soundFx.playSuccessChime();

    // Sync to Supabase in real-time with user account isolation
    syncReceiptToSupabase(completeDoc, userProfile);

    // Trigger celebratory particle blast
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#00f2fe', '#8b5cf6', '#10b981', '#ffffff']
      });
    } catch (e) {}

    return completeDoc;
  };

  const updateDocument = (id, updatedFields) => {
    let updatedTarget = null;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          updatedTarget = { ...doc, ...updatedFields };
          return updatedTarget;
        }
        return doc;
      })
    );
    soundFx.playClick();

    // Sync edited document to Supabase in real-time with user account isolation
    if (updatedTarget) {
      syncReceiptToSupabase(updatedTarget, userProfile);
    }
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (inspectingDoc && inspectingDoc.id === id) {
      setInspectingDoc(null);
    }
    soundFx.playClick();

    // Delete from Supabase in real-time
    deleteReceiptFromSupabase(id);
  };

  const resetDemoData = () => {
    setDocuments(initialReceipts);
    soundFx.playSuccessChime();
  };

  const clearAllData = () => {
    setDocuments([]);
    soundFx.playClick();
  };

  return (
    <AppContext.Provider
      value={{
        documents,
        activeTab,
        setActiveTab: (tab) => {
          soundFx.playClick();
          setActiveTab(tab);
        },
        language,
        setLanguage: (lang) => {
          soundFx.playClick();
          setLanguage(lang);
        },
        currency,
        setCurrency: (c) => {
          soundFx.playClick();
          setCurrency(c);
        },
        settings,
        setSettings,
        currentUser,
        userProfile,
        setUserProfile,
        updateUserProfile,
        saveCustomProfileToStorage,
        getSavedCustomProfile,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPasswordForEmail,
        invokeEdgeFunction,
        signOut,
        deleteAccount,
        inspectingDoc,
        setInspectingDoc,
        t,
        formatCurrency,
        addDocument,
        updateDocument,
        deleteDocument,
        resetDemoData,
        clearAllData,
        currencyRates,
        theme,
        setTheme,
        toggleTheme,
        notifications,
        setNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        addNotification,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        soundFx,
        isTermsOpen,
        setIsTermsOpen,
        isTermsAccepted,
        setIsTermsAccepted,
        isPrivacyOpen,
        setIsPrivacyOpen,
        isCookieModalOpen,
        setIsCookieModalOpen,
        cookieConsent,
        saveCookieConsent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
