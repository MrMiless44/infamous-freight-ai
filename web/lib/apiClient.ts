import axios from "axios";

const TOKEN_KEY = "auth_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

// Expose helpers for quick manual testing in the browser console
if (typeof window !== "undefined") {
  (window as any).setAuthToken = setAuthToken;
  (window as any).clearAuthToken = clearAuthToken;
}

export function resolveApiBase() {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }

  // Prefer proxy route in the browser, direct port fallback for SSR/dev.
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }

  return "http://localhost:4000/api";
}

const apiClient = axios.create({
  baseURL: resolveApiBase(),
  timeout: 10000
});

apiClient.interceptors.request.use(config => {
  const headers = config.headers || {};

  // Attach JWT from local storage if available
  if (typeof window !== "undefined") {
    const token = getAuthToken();
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Optional public API key for dev/demo scenarios
  if (process.env.NEXT_PUBLIC_API_KEY && !headers["x-api-key"]) {
    headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY;
  }

  config.headers = headers;
  return config;
});

export default apiClient;
