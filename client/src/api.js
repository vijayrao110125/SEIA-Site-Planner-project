const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const DEV_FALLBACK = "http://localhost:3001";
const DEV_MODE = import.meta.env.MODE === "development";

function withBase(path) {
  const base = API_BASE || (DEV_MODE ? DEV_FALLBACK : "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
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
  const res = await fetch(withBase(path));
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(withBase(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiPut(path, body) {
  const res = await fetch(withBase(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(withBase(path), { method: "DELETE" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
