import axios from "axios";
import { ngrokHeaders, resolveApiBaseUrl } from "./apiBaseUrl";

export const API_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json", ...ngrokHeaders() },
});

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string; refresh?: string }>(
        `${API_URL}/auth/refresh/`,
        { refresh },
        { headers: ngrokHeaders() }
      )
      .then(({ data }) => {
        localStorage.setItem("access_token", data.access);
        if (data.refresh) {
          localStorage.setItem("refresh_token", data.refresh);
        }
        return data.access;
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    const headers = config.headers;
    if (headers && typeof (headers as { set?: unknown }).set === "function") {
      (headers as { set: (key: string, value?: string) => void }).set(
        "Content-Type",
        undefined as unknown as string
      );
    } else if (headers) {
      delete (headers as Record<string, unknown>)["Content-Type"];
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    const access = await refreshAccessToken();
    if (!access) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
  }
);

export function parseApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; warnings?: string[] }
      | Record<string, string | string[]>
      | undefined;
    if (data && typeof data === "object") {
      if (Array.isArray(data.warnings)) {
        const warning = data.warnings.map((item) => item.trim()).find(Boolean);
        if (warning) return warning;
      }
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
      for (const value of Object.values(data)) {
        if (typeof value === "string" && value.trim()) return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      }
    }
    if (error.response?.status === 401) {
      return "Your session expired. Please sign in again.";
    }
    if (error.response?.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (!error.response) {
      return "Could not reach the GRE server. Check your connection or try again shortly.";
    }
    if (error.response.status === 400) {
      return fallback;
    }
  }
  if (error instanceof Error && error.message) {
    if (!axios.isAxiosError(error) || !/^Request failed with status code \d+$/i.test(error.message)) {
      return error.message;
    }
  }
  return fallback;
}

/** Structured manuscript extraction payloads may arrive on non-2xx responses (legacy API). */
export function extractionPayloadFromAxiosError<T extends object>(
  error: unknown
): T | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (
    "warnings" in row ||
    "success" in row ||
    "abstract" in row ||
    "introduction" in row
  ) {
    return row as T;
  }
  return null;
}

export default api;
