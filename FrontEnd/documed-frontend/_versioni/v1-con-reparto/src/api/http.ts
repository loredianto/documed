const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8282").replace(/\/$/, "");
const TOKEN_STORAGE_KEY = "documed.accessToken";
export const AUTH_EXPIRED_EVENT = "documed:auth-expired";

interface ApiErrorPayload {
  message?: string;
  error_description?: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isTokenUsable(token: string | null): boolean {
  if (!token) return false;
  try {
    const payloadPart = token.split(".")[1];
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getTokenUsername(): string {
  try {
    const token = getAccessToken();
    if (!token) return "";
    const payloadPart = token.split(".")[1];
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { sub?: string; preferred_username?: string };
    return payload.preferred_username ?? payload.sub ?? "";
  } catch {
    return "";
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload = {};
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    // Some proxy/network failures have no JSON body.
  }
  const message = payload.message ?? payload.error_description ?? "La richiesta non è stata completata";
  return new ApiError(message, response.status, payload.code);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw await parseError(response);
  }
  return response;
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await apiFetch(path, { ...init, headers });
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiBaseUrl(): string {
  return API_BASE_URL;
}
