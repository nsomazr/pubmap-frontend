/**
 * Resolve API base URL for axios/fetch.
 * In dev, use relative /api when viewing via ngrok so Vite proxies to the backend.
 */
export function resolveApiBaseUrl(): string {
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (typeof window === "undefined") {
    return env || "/api";
  }

  const configured = env || "/api";

  if (configured.startsWith("http")) {
    const isLocalBackend = /\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(configured);
    const host = window.location.hostname;
    const viewerIsRemote =
      host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".local");
    if (isLocalBackend && viewerIsRemote) {
      return `${window.location.origin}/api`;
    }
    return configured.replace(/\/$/, "");
  }

  return configured.startsWith("/") ? configured : `/${configured}`;
}

/** ngrok free tier returns an HTML interstitial unless this header is sent. */
export function ngrokHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  if (!window.location.hostname.endsWith(".ngrok-free.app")) return {};
  return { "ngrok-skip-browser-warning": "true" };
}
