const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const DEV_FALLBACK = "http://localhost:3001";
const IS_FILE_PROTOCOL = typeof window !== "undefined" && window.location?.protocol === "file:";
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000);

function withBase(path) {
  // Prefer same-origin `/api/*` (so Vite's dev proxy works) unless:
  // - `VITE_API_BASE` is explicitly provided (static hosting), or
  // - we're running from `file://` (electron build), where relative URLs won't work.
  const base = API_BASE || (IS_FILE_PROTOCOL ? DEV_FALLBACK : "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

async function fetchWithTimeout(url, init) {
  if (typeof AbortController === "undefined") return fetch(url, init);
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let didTimeout = false;
  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  try {
    const { timeoutMs: _timeoutMs, ...rest } = init || {};
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (e) {
    // Some browsers surface aborts as "signal is aborted without reason".
    // Turn our timeout-driven abort into a clearer error.
    if ((e?.name === "AbortError" || String(e).includes("AbortError")) && didTimeout) {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function throwApiError(res) {
  const contentType = res.headers.get("content-type") || "";
  let body;
  try {
    body = contentType.includes("application/json") ? await res.json() : await res.text();
  } catch {
    body = null;
  }
  const message =
    (body && typeof body === "object" && body.error) ||
    (typeof body === "string" && body) ||
    res.statusText ||
    "Request failed";
  const err = new Error(message);
  err.status = res.status;
  err.body = body;
  throw err;
}

export async function apiGet(path) {
  const res = await fetchWithTimeout(withBase(path));
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetchWithTimeout(withBase(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPut(path, body) {
  const res = await fetchWithTimeout(withBase(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetchWithTimeout(withBase(path), { method: "DELETE" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
