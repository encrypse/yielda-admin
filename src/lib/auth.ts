const TOKEN_KEY = 'admin_token';
const EXPIRY_KEY = 'session_expires_at';
const PENDING_TOKEN_KEY = 'admin_pending_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, expiresInMs: number) {
  localStorage.setItem(TOKEN_KEY, token);
  const expiresAt = Date.now() + expiresInMs;
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
  // Cookie for middleware SSR check
  document.cookie = `admin_token=${token}; path=/; max-age=${Math.floor(expiresInMs / 1000)}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  document.cookie = 'admin_token=; path=/; max-age=0';
}

export function getExpiry(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(EXPIRY_KEY);
  return raw ? Number(raw) : null;
}

export function setExpiry(expiresAt: number) {
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
}

export function getPendingToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_TOKEN_KEY);
}

export function setPendingToken(token: string) {
  sessionStorage.setItem(PENDING_TOKEN_KEY, token);
}

export function clearPendingToken() {
  sessionStorage.removeItem(PENDING_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  const expiry = getExpiry();
  if (!token || !expiry) return false;
  return Date.now() < expiry;
}
