import { AUTH_TOKEN_TTL_SECONDS } from "../config.js";
import {
  base64UrlDecodeToBuffer,
  base64UrlEncode,
  hmacSha256,
  timingSafeEqualUtf8
} from "../lib/crypto.js";

export function signToken({
  user,
  secret,
  ttlSeconds = AUTH_TOKEN_TTL_SECONDS
}: {
  user: { id: string; email: string };
  secret: string;
  ttlSeconds?: number;
}) {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + ttlSeconds;
  const payload = { sub: user.id, email: user.email, iat: nowSec, exp: expSec };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sigB64 = base64UrlEncode(hmacSha256(secret, payloadB64));
  return `${payloadB64}.${sigB64}`;
}

export function verifyToken({ token, secret }: { token: string; secret: string }) {
  const [payloadB64, sigB64] = String(token || "").split(".");
  if (!payloadB64 || !sigB64) return null;
  const expected = base64UrlEncode(hmacSha256(secret, payloadB64));
  if (!timingSafeEqualUtf8(sigB64, expected)) return null;

  try {
    const payloadJson = base64UrlDecodeToBuffer(payloadB64).toString("utf8");
    const payload = JSON.parse(payloadJson);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload?.exp || nowSec >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromReq(req: { headers: { authorization?: string } }) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m?.[1] || "";
}

