import crypto from "crypto";
import { base64UrlDecodeToBuffer, base64UrlEncode } from "../lib/crypto.js";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(key)}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = base64UrlDecodeToBuffer(parts[1]);
  const expected = base64UrlDecodeToBuffer(parts[2]);
  const actual = crypto.scryptSync(password, salt, expected.length);
  try {
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

