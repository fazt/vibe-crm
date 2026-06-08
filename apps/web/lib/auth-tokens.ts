const AUTH_STORAGE_KEY = 'vibe-auth';

export type StoredAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export function getAuthTokens(): StoredAuthTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: StoredAuthTokens };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    parsed.state = {
      ...parsed.state,
      accessToken,
      refreshToken,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage errors
  }
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.state = {
      ...parsed.state,
      accessToken: null,
      refreshToken: null,
      user: null,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
