export const LOGIN_RETURN_PARAM = "next";
const LOGIN_RETURN_STORAGE_KEY = "gre_login_return_path";

/** Only allow same-origin relative paths (prevents open redirects). */
export function sanitizeLoginReturnPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const raw = path.trim();
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/register")) return null;
  if (/^\/\\|\/%2f%2f/i.test(raw)) return null;
  return raw;
}

export function buildLoginPath(returnTo?: string | null): string {
  const safe = sanitizeLoginReturnPath(returnTo ?? null);
  if (!safe) return "/login";
  return `/login?${LOGIN_RETURN_PARAM}=${encodeURIComponent(safe)}`;
}

export function buildRegisterPath(returnTo?: string | null): string {
  const safe = sanitizeLoginReturnPath(returnTo ?? null);
  if (!safe) return "/register";
  return `/register?${LOGIN_RETURN_PARAM}=${encodeURIComponent(safe)}`;
}

export function loginReturnPathFromSearch(search: string): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return sanitizeLoginReturnPath(params.get(LOGIN_RETURN_PARAM));
}

export function storeLoginReturnPath(path: string | null | undefined) {
  const safe = sanitizeLoginReturnPath(path ?? null);
  if (!safe) {
    sessionStorage.removeItem(LOGIN_RETURN_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(LOGIN_RETURN_STORAGE_KEY, safe);
}

export function peekLoginReturnPath(): string | null {
  return sanitizeLoginReturnPath(sessionStorage.getItem(LOGIN_RETURN_STORAGE_KEY));
}

export function consumeLoginReturnPath(): string | null {
  const stored = peekLoginReturnPath();
  sessionStorage.removeItem(LOGIN_RETURN_STORAGE_KEY);
  return stored;
}

export function resolvePostAuthPath(opts?: {
  search?: string;
  fallback?: string;
}): string {
  const fromQuery = opts?.search ? loginReturnPathFromSearch(opts.search) : null;
  const fromStorage = peekLoginReturnPath();
  return fromQuery || fromStorage || opts?.fallback || "/dashboard";
}
