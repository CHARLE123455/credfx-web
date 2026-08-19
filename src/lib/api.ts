import type { UserProfile } from "./types";

const API_BASE = "/api/v1";
const TOKEN_KEY = "credfx_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

interface RequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

export interface ApiData {
  message?: string;
  data?: unknown;
  accessToken?: string;
  user?: UserProfile;
}

const apiRequest = async (endpoint: string, options: RequestOptions = {}): Promise<ApiData> => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const text = await res.text();

  if (!text || text.trim() === "") {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return {};
  }

  let data: ApiData;
  try {
    data = JSON.parse(text) as ApiData;
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok) {
    const msg = data.message ?? "Request failed";
    throw new Error(msg);
  }
  return data;
};

export const api = {
  get: (url: string) => apiRequest(url),
  post: (url: string, body: unknown) => apiRequest(url, { method: "POST", body: JSON.stringify(body) }),
  patch: (url: string, body: unknown) => apiRequest(url, { method: "PATCH", body: JSON.stringify(body) }),
};
