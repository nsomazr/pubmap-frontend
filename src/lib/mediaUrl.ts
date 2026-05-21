import { resolveApiBaseUrl } from "./apiBaseUrl";

/** Resolve Laravel/Django media paths or absolute URLs for images and PDFs. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const clean = path.replace(/^\/+/, "");

  // Dev: same-origin paths so Vite proxies /media and /storage to the API (fixes PDF iframe preview)
  if (import.meta.env.DEV && typeof window !== "undefined") {
    if (clean.startsWith("storage/")) return `/${clean}`;
    if (clean.startsWith("media/")) return `/${clean}`;
    return `/media/${clean}`;
  }

  const api = resolveApiBaseUrl();
  const origin = api.startsWith("/")
    ? (typeof window !== "undefined" ? window.location.origin : "")
    : api.replace(/\/api\/?$/, "");
  if (clean.startsWith("storage/")) {
    return `${origin}/${clean}`;
  }
  if (clean.startsWith("media/")) {
    return `${origin}/${clean}`;
  }
  return `${origin}/media/${clean}`;
}

export function isHexColor(value?: string | null): boolean {
  return Boolean(value && /^#[0-9A-Fa-f]{3,8}$/.test(value));
}
