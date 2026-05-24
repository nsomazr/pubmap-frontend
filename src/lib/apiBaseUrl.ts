/**
 * Resolve API base URL for axios/fetch.
 * In dev, use relative /api when viewing via ngrok so Vite proxies to the backend.
 */
export function resolveApiBaseUrl(): string {
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (typeof window === "undefined") {
    return env || "/api";
  }

  const host = window.location.hostname;
  const onGreSite =
    host === "gre.nileagi.com" ||
    host === "www.gre.nileagi.com" ||
    host.endsWith(".gre.nileagi.com");

  // Production GRE: API lives on api.gre.nileagi.com unless the build explicitly
  // sets a relative /api path (requires nginx/apache to proxy /api on this host).
  if (onGreSite) {
    if (env?.startsWith("http")) {
      return env.replace(/\/$/, "");
    }
    if (env === "/api" || env?.startsWith("/")) {
      return env.startsWith("/") ? env : `/${env}`;
    }
    return "https://api.gre.nileagi.com/api";
  }

  const configured = env || "/api";

  if (configured.startsWith("http")) {
    const isLocalBackend = /\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(configured);
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
