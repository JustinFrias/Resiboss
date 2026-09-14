/**
 * Fast synchronous session cache utility for offline-first authentication routing.
 * Ensures the app recovers persisted Supabase sessions immediately on boot
 * with zero network delay and zero white-screen / splash-screen hangs.
 */

export const SESSION_PROFILE_KEY = 'resiboss_session_profile_v1';
export const USER_PROFILE_KEY = 'resiboss_user_profile_v1';

/**
 * Scans localStorage for an active persisted Supabase session without making any network calls.
 * Supabase saves sessions under 'sb-<project-ref>-auth-token' or 'supabase.auth.token'.
 */
export function getCachedSupabaseSession() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isSupabaseKey =
        (key.startsWith('sb-') && key.endsWith('-auth-token')) ||
        key === 'supabase.auth.token';

      if (isSupabaseKey) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
          const parsed = JSON.parse(raw);
          // Supabase JS v2 format: { access_token, user, ... }
          const user = parsed?.user || parsed?.currentSession?.user;
          const session = parsed?.access_token ? parsed : parsed?.currentSession;

          if (user && (user.id || user.email)) {
            return {
              user,
              session,
              key,
            };
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  } catch (e) {
    console.warn('Failed reading cached Supabase session from localStorage:', e);
  }

  return null;
}

/**
 * Returns the cached Supabase user object synchronously if available.
 */
export function getInitialSupabaseUser() {
  const cached = getCachedSupabaseSession();
  return cached?.user || null;
}

/**
 * Resolves user-customized profile overrides (name, avatar, etc.) from localStorage.
 */
export function getSavedCustomProfile(identifier) {
  if (!identifier || typeof window === 'undefined') return null;
  try {
    const key = `resiboss_custom_profile_${identifier.toString().trim().toLowerCase()}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Builds a normalized Resiboss user profile from a Supabase User object.
 */
export function buildUserProfileFromUser(user, fallbackProvider = 'google') {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const email = (user.email || meta.email || '').trim().toLowerCase();
  const id = user.id;

  const localSaved =
    (email ? getSavedCustomProfile(email) : null) ||
    (id ? getSavedCustomProfile(id) : null) ||
    {};
  const cloudSaved = meta.custom_profile || {};
  const custom = { ...cloudSaved, ...localSaved };

  const firstName =
    custom.firstName !== undefined && custom.firstName !== ''
      ? custom.firstName
      : (meta.given_name || meta.full_name?.split(' ')[0] || email.split('@')[0] || 'User');

  const lastName =
    custom.lastName !== undefined && custom.lastName !== ''
      ? custom.lastName
      : (meta.family_name || meta.full_name?.split(' ').slice(1).join(' ') || '');

  const photo =
    custom.photo !== undefined
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
}

/**
 * Recovers the active authenticated user profile from localStorage synchronously.
 * 1. Checks application-level cached profile.
 * 2. Checks persisted Supabase session in localStorage.
 * Guaranteed to return the profile synchronously without triggering network calls.
 */
export function getInitialUserProfile() {
  try {
    if (typeof window !== 'undefined') {
      // 1. Check direct app profile cache
      const saved =
        localStorage.getItem(SESSION_PROFILE_KEY) ||
        sessionStorage.getItem(SESSION_PROFILE_KEY) ||
        localStorage.getItem(USER_PROFILE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.isAuthSession || parsed.id || parsed.email)) {
          const email = parsed.email;
          const custom =
            (email ? getSavedCustomProfile(email) : null) ||
            (parsed.id ? getSavedCustomProfile(parsed.id) : null);
          return custom ? { ...parsed, ...custom } : parsed;
        }
      }

      // 2. Check Supabase persisted auth token
      const cached = getCachedSupabaseSession();
      if (cached?.user) {
        const provider =
          cached.user.app_metadata?.provider ||
          cached.user.identities?.[0]?.provider ||
          'google';
        const profile = buildUserProfileFromUser(cached.user, provider);
        if (profile) {
          try {
            localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
          } catch (e) {}
          return profile;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Checks whether any cached session exists right now (synchronous).
 */
export function hasCachedSession() {
  return Boolean(getInitialUserProfile());
}
