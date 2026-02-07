import { API_BASE, API_FETCH_TIMEOUT_MS, AUTH_TOKEN_KEY } from "./lib/constants";

type ApiError = Error & { status?: number; body?: unknown };

function withBase(path: string) {
  // If `VITE_API_BASE` is unset, requests are same-origin.
  // In local dev this allows Vite to proxy `/api` (see `client/vite.config.js`).
  const base = API_BASE;
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

function getAuthToken() {
  try {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    return t || "";
  } catch {
    return "";
  }
}

function withAuth(headers: Record<string, string> = {}) {
  const token = getAuthToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function throwApiError(res: Response): Promise<never> {
  const contentType = res.headers.get("content-type") || "";
  let body: unknown;
  try {
    body = contentType.includes("application/json") ? await res.json() : await res.text();
  } catch {
    body = null;
  }
  const message =
    (body && typeof body === "object" && (body as any).error) ||
    (typeof body === "string" && body) ||
    res.statusText ||
    "Request failed";
  const err: ApiError = new Error(message);
  err.status = res.status;
  err.body = body;
  throw err;
}

export async function apiGet(path: string) {
  const res = await fetchWithTimeout(withBase(path), { headers: withAuth() });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetchWithTimeout(withBase(path), {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPut(path: string, body: unknown) {
  const res = await fetchWithTimeout(withBase(path), {
    method: "PUT",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetchWithTimeout(withBase(path), { method: "DELETE", headers: withAuth() });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

