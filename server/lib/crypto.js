import crypto from "crypto";

export function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function base64UrlDecodeToBuffer(b64url) {
  const b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

export function hmacSha256(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest();
}

export function timingSafeEqualUtf8(a, b) {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

