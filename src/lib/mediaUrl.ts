import { resolveApiBaseUrl } from "./apiBaseUrl";

/** Origin that serves uploaded files (/media, /storage). */
function resolveMediaOrigin(): string {
  const api = resolveApiBaseUrl();
  if (api.startsWith("http")) {
    return api.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Resolve Laravel/Django media paths or absolute URLs for images and PDFs. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalized = path.replace(/^\/+/, "");

  // Dev: same-origin paths so Vite proxies /media and /storage to the backend.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    if (normalized.startsWith("storage/")) return `/${normalized}`;
    if (normalized.startsWith("media/")) return `/${normalized}`;
    return `/media/${normalized}`;
  }

  const origin = resolveMediaOrigin();
  if (!origin) return null;

  if (normalized.startsWith("storage/")) {
    return `${origin}/${normalized}`;
  }
  if (normalized.startsWith("media/")) {
    return `${origin}/${normalized}`;
  }
  return `${origin}/media/${normalized}`;
}

export function isHexColor(value?: string | null): boolean {
  return Boolean(value && /^#[0-9A-Fa-f]{3,8}$/.test(value));
}
