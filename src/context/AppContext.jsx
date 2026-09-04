import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialReceipts } from '../utils/initialData';
import { translations } from '../utils/i18n';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

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

export const AppProvider = ({ children }) => {
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialReceipts;
    } catch (e) {
      return initialReceipts;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('PHP');
  const [inspectingDoc, setInspectingDoc] = useState(null);

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

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('resiboss_user_profile_v1');
      return saved ? JSON.parse(saved) : {
        firstName: 'Justinfrias951',
        lastName: 'User',
        email: 'justinfrias951@gmail.com',
        photo: '/user_avatar.png',
      };
    } catch (e) {
      return {
        firstName: 'Justinfrias951',
        lastName: 'User',
        email: 'justinfrias951@gmail.com',
        photo: '/user_avatar.png',
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
    return [
      {
        id: 'notif-1',
        title: 'OCR Scanner Ready',
        desc: 'Receipt #REC-2025-001 scanned with 99.4% accuracy.',
        time: '5m ago',
        read: false,
        type: 'scanner',
      },
      {
        id: 'notif-2',
        title: 'Cloud Export Verified',
        desc: 'Purchases & Expenses Journal synced to vault.',
        time: '45m ago',
        read: false,
        type: 'export',
      },
      {
        id: 'notif-3',
        title: 'VAT Input Tax Sync',
        desc: 'Computed VAT Exp (P-N)/1.12 formulas saved.',
        time: '2h ago',
        read: false,
        type: 'tax',
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

  const markAllNotificationsAsRead = () => {
    soundFx.playClick();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

  const updateUserProfile = (updatedProfile) => {
    setUserProfile((prev) => {
      const merged = { ...prev, ...updatedProfile };
      try {
        localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(merged));
      } catch (err) {
        console.warn('LocalStorage quota warning for profile:', err);
        try {
          const safeMerged = {
            ...merged,
            photo: merged.photo && merged.photo.length > 50000 ? '/user_avatar.png' : merged.photo,
          };
          localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(safeMerged));
        } catch (e2) {}
      }
      return merged;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('resiboss_user_profile_v1', JSON.stringify(userProfile));
    } catch (e) {}
  }, [userProfile]);

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
        userProfile,
        setUserProfile,
        updateUserProfile,
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
        markAllNotificationsAsRead,
        clearNotifications,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        soundFx,
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
