import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialReceipts } from '../utils/initialData';
import { translations } from '../utils/i18n';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper: check if running inside a Capacitor native platform (Android/iOS)
function isNativeApp() {
  try {
    // eslint-disable-next-line no-undef
    return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
  } catch (_) {
    return false;
  }
}

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

export const AppProvider = ({ children }) => {
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Automatically purge any previous demo receipts
      return parsed.filter((doc) => !DEMO_RECEIPT_IDS.has(doc.id));
    } catch (e) {
      return [];
    }
  });

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

  // Real Supabase User State (null when user is NOT signed in)
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('resiboss_user_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only keep if it is a real authenticated session
        if (parsed && parsed.isAuthSession) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      return null;
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
    return [
      {
        id: 'notif-1',
        title: 'OCR Scanner Ready',
        desc: 'Receipt #REC-2025-001 scanned with 99.4% accuracy.',
        time: '5m ago',
        read: false,
        type: 'scanner',
        targetTab: 'scanner',
        targetLabel: 'Scanner',
        docId: 'REC-2025-001',
      },
      {
        id: 'notif-2',
        title: 'Cloud Export Verified',
        desc: 'Purchases & Expenses Journal synced to vault.',
        time: '45m ago',
        read: false,
        type: 'export',
        targetTab: 'export',
        targetLabel: 'Export Journal',
      },
      {
        id: 'notif-3',
        title: 'VAT Input Tax Sync',
        desc: 'Computed VAT Exp (P-N)/1.12 formulas saved.',
        time: '2h ago',
        read: false,
        type: 'tax',
        targetTab: 'export',
        targetLabel: 'Tax Journal',
      },
    ];
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
    soundFx.playClick();
    setNotifications([]);
  };

  // Listen for Supabase Authentication State (Google OAuth)
  useEffect(() => {
    if (!supabase) return;

    // Check existing active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const meta = session.user.user_metadata || {};
        const profile = {
          id: session.user.id,
          firstName: meta.given_name || meta.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'User',
          lastName: meta.family_name || meta.full_name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email,
          photo: meta.avatar_url || meta.picture || null,
          isAuthSession: true,
        };
        setUserProfile(profile);
        try {
          localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(profile));
        } catch (e) {}
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        try {
          localStorage.removeItem('resiboss_user_profile_v1');
        } catch (e) {}
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const meta = session.user.user_metadata || {};
        const profile = {
          id: session.user.id,
          firstName: meta.given_name || meta.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'User',
          lastName: meta.family_name || meta.full_name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email,
          photo: meta.avatar_url || meta.picture || null,
          isAuthSession: true,
        };
        setUserProfile(profile);
        try {
          localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(profile));
        } catch (e) {}
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        try {
          localStorage.removeItem('resiboss_user_profile_v1');
        } catch (e) {}
      }
    });

    // ── Android deep-link handler for Google OAuth callback ──────────────────
    // When the Chrome Custom Tab redirects back to resiboss.vercel.app,
    // Android intercepts the URL via the intent filter and fires appUrlOpen.
    // We then extract the tokens from the URL hash and set the Supabase session.
    let appUrlListener = null;
    if (isNativeApp()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async ({ url }) => {
          // Close the Chrome Custom Tab if still open
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          } catch (_) {}

          // Parse the hash fragment for Supabase tokens
          // e.g. https://resiboss.vercel.app/#access_token=...&refresh_token=...
          try {
            const hashStr = url.includes('#') ? url.split('#')[1] : '';
            const params = new URLSearchParams(hashStr);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              // onAuthStateChange will fire and update state automatically
            }
          } catch (err) {
            console.warn('[ResiBoss] OAuth deep-link parse error:', err);
          }
        }).then((handle) => {
          appUrlListener = handle;
        });
      }).catch(() => {});
    }

    return () => {
      subscription?.unsubscribe();
      appUrlListener?.remove?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    if (isNativeApp()) {
      // ── Native Android: use Chrome Custom Tab (stays in-app) ──────────────
      // Get the OAuth URL without triggering a browser redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://resiboss.vercel.app',
          skipBrowserRedirect: true, // <-- key: gives us the URL, doesn't navigate
        },
      });
      if (error) throw error;

      // Open in Chrome Custom Tab (Google allows this, unlike WebViews)
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, windowName: '_self' });
      // The appUrlOpen listener (registered in useEffect below) handles the callback
      return data;
    } else {
      // ── Web: standard OAuth flow ──────────────────────────────────────────
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    }
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
    try {
      localStorage.removeItem('resiboss_user_profile_v1');
    } catch (e) {}
  };

  // Pipedream Authentication Webhook Integration
  const DEFAULT_PIPEDREAM_URL = 'https://eoihgfgvur5v27v.m.pipedream.net';

  const [pipedreamAuthUrl, setPipedreamAuthUrlState] = useState(() => {
    try {
      return (
        localStorage.getItem('resiboss_pipedream_auth_url') ||
        import.meta.env.VITE_PIPEDREAM_AUTH_URL ||
        DEFAULT_PIPEDREAM_URL
      );
    } catch (e) {
      return DEFAULT_PIPEDREAM_URL;
    }
  });

  const setPipedreamAuthUrl = (url) => {
    const trimmed = (url || '').trim();
    setPipedreamAuthUrlState(trimmed);
    try {
      localStorage.setItem('resiboss_pipedream_auth_url', trimmed);
    } catch (e) {}
  };

  const signInWithPipedream = async (email, password) => {
    const url = pipedreamAuthUrl || import.meta.env.VITE_PIPEDREAM_AUTH_URL || DEFAULT_PIPEDREAM_URL;
    if (!url) {
      throw new Error('Hindi maabot ang authentication server. Pakisubukang muli mamaya.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'login',
          email: email.trim().toLowerCase(),
          password,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Maling email o password.');
      }

      const user = data.user || {};
      const profile = {
        id: user.id || `user_${Date.now()}`,
        firstName: user.firstName || user.fullName?.split(' ')[0] || email.split('@')[0],
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || email.trim().toLowerCase(),
        photo: user.photo || null,
        authProvider: 'pipedream',
        isAuthSession: true,
        token: data.token || null,
      };

      setCurrentUser({ id: profile.id, email: profile.email });
      setUserProfile(profile);
      try {
        localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(profile));
      } catch (e) {}

      return profile;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Nag-timeout ang server. Pakisubukang muli o tingnan ang internet.');
      }
      throw err;
    }
  };

  const registerWithPipedream = async (fullName, email, password) => {
    const url = pipedreamAuthUrl || import.meta.env.VITE_PIPEDREAM_AUTH_URL || DEFAULT_PIPEDREAM_URL;
    if (!url) {
      throw new Error('Hindi maabot ang authentication server. Pakisubukang muli mamaya.');
    }

    const trimmedName = fullName.trim();
    const parts = trimmedName.split(' ');
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'register',
          fullName: trimmedName,
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          password,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Nabigo ang pag-register. Pakisubukang muli.');
      }

      const user = data.user || {};
      const profile = {
        id: user.id || `user_${Date.now()}`,
        firstName: user.firstName || firstName,
        lastName: user.lastName || lastName,
        email: user.email || email.trim().toLowerCase(),
        photo: null,
        authProvider: 'pipedream',
        isAuthSession: true,
        token: data.token || null,
      };

      setCurrentUser({ id: profile.id, email: profile.email });
      setUserProfile(profile);
      try {
        localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(profile));
      } catch (e) {}

      return profile;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Nag-timeout ang server. Pakisubukang muli o tingnan ang internet.');
      }
      throw err;
    }
  };

  const updateUserProfile = (updatedProfile) => {
    setUserProfile((prev) => {
      const merged = { ...prev, ...updatedProfile, isAuthSession: true };
      try {
        localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(merged));
      } catch (err) {
        console.warn('LocalStorage quota warning for profile:', err);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (e) {}
  }, [documents]);

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
      date: newDoc.date || new Date().toISOString().split('T')[0],
      time: newDoc.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: newDoc.status || 'Verified',
      currency: 'PHP',
      color: newDoc.color || '#00f2fe'
    };

    setDocuments((prev) => [completeDoc, ...prev]);
    soundFx.playSuccessChime();

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
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updatedFields } : doc))
    );
    soundFx.playClick();
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (inspectingDoc && inspectingDoc.id === id) {
      setInspectingDoc(null);
    }
    soundFx.playClick();
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
        signInWithGoogle,
        pipedreamAuthUrl,
        setPipedreamAuthUrl,
        signInWithPipedream,
        registerWithPipedream,
        signOut,
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
