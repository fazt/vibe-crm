import type { ApiError } from '@vibe-crm/shared';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiRequestError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.statusCode = error.statusCode;
    this.errors = error.errors;
  }
}

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  skipWorkspace?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

function getStoredTokens() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vibe-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state as {
      accessToken: string | null;
      refreshToken: string | null;
    };
  } catch {
    return null;
  }
}

function getWorkspaceId() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vibe-workspace');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state?.currentWorkspaceId as string | null;
  } catch {
    return null;
  }
}

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `vibe-access-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = 'vibe-access-token=; path=/; max-age=0';
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    const raw = localStorage.getItem('vibe-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = data.accessToken;
      parsed.state.refreshToken = data.refreshToken;
      localStorage.setItem('vibe-auth', JSON.stringify(parsed));
    }

    setAuthCookie(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function buildUrl(path: string, params?: RequestOptions['params']) {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`,
  );
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, skipAuth, skipWorkspace, headers: customHeaders, ...init } = options;

  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
  }

  if (!skipWorkspace) {
    const workspaceId = getWorkspaceId();
    if (workspaceId) {
      headers.set('X-Workspace-Id', workspaceId);
    }
  }

  let res = await fetch(buildUrl(path, params), { ...init, headers });

  if (res.status === 401 && !skipAuth) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      const tokens = getStoredTokens();
      if (tokens?.accessToken) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      }
      res = await fetch(buildUrl(path, params), { ...init, headers });
    }
  }

  if (!res.ok) {
    let error: ApiError;
    try {
      error = (await res.json()) as ApiError;
    } catch {
      error = { statusCode: res.status, message: res.statusText || 'Request failed' };
    }
    throw new ApiRequestError(error);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function syncAuthCookie(accessToken: string | null) {
  setAuthCookie(accessToken);
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    api<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    api<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),
  patch: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};
