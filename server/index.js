import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { CATALOG, BATTERY_TYPES } from "./catalog.js";
import {
  createUserWithName,
  getUserByEmail,
  getUserById,
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession
} from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MAX_WIDTH_FT = 100;
const AUTH_TOKEN_KEY = process.env.AUTH_TOKEN_KEY || "dev-insecure-secret";
if (!process.env.AUTH_TOKEN_KEY && process.env.NODE_ENV === "production") {
  console.warn("WARNING: AUTH_TOKEN_KEY is not set; using insecure default");
}

// --- helpers ---
function clampNonNegInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecodeToBuffer(b64url) {
  const b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

function hmacSha256(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest();
}

function signToken(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + 7 * 24 * 60 * 60; // 7 days
  const payload = { sub: user.id, email: user.email, iat: nowSec, exp: expSec };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sigB64 = base64UrlEncode(hmacSha256(AUTH_TOKEN_KEY, payloadB64));
  return `${payloadB64}.${sigB64}`;
}

function verifyToken(token) {
  const [payloadB64, sigB64] = String(token || "").split(".");
  if (!payloadB64 || !sigB64) return null;
  const expected = base64UrlEncode(hmacSha256(AUTH_TOKEN_KEY, payloadB64));
  try {
    const a = Buffer.from(sigB64, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

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

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(key)}`;
}

function verifyPassword(password, stored) {
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

function getTokenFromReq(req) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m?.[1] || "";
}

async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: "Unauthorized" });
    const userId = payload?.sub;
    if (typeof userId !== "string" || !userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await getUserById(userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = { id: user.id, email: user.email, name: user.name ?? null };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

function normalizeCounts(counts) {
  const safe = {};
  for (const k of Object.keys(CATALOG)) safe[k] = 0;
  for (const k of BATTERY_TYPES) safe[k] = clampNonNegInt(counts?.[k]);
  // Transformer is derived; ignore user input
  const batteryCount = BATTERY_TYPES.reduce((s, t) => s + safe[t], 0);
  safe.Transformer = Math.ceil(batteryCount / 2);
  return safe;
}

function computeTotals(counts) {
  let totalCost = 0;
  let totalEnergyMWh = 0;

  for (const [type, c] of Object.entries(counts)) {
    const def = CATALOG[type];
    totalCost += c * def.cost;
    totalEnergyMWh += c * def.energyMWh;
  }

  return { totalCost, totalEnergyMWh };
}

function expandRectangles(counts) {
  // each instance becomes a rect
  const rects = [];
  let idx = 1;
  for (const [type, c] of Object.entries(counts)) {
    const def = CATALOG[type];
    for (let i = 0; i < c; i++) {
      rects.push({
        id: `${type}-${idx++}`,
        type,
        w: def.w,
        d: def.d
      });
    }
  }
  // sort for better packing
  rects.sort((a, b) => (b.w * b.d) - (a.w * a.d));
  return rects;
}

function packLayout(rects) {
  // Greedy row packing (shelf algorithm)
  const placements = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let usedWidth = 0;

  for (const r of rects) {
    if (r.w > MAX_WIDTH_FT) {
      // impossible with given catalog (won't happen here), but keep safe
      throw new Error(`Item ${r.type} width ${r.w} exceeds max width`);
    }

    if (x + r.w > MAX_WIDTH_FT) {
      // new row
      y += rowHeight;
      x = 0;
      rowHeight = 0;
    }

    placements.push({ ...r, x, y });
    x += r.w;
    rowHeight = Math.max(rowHeight, r.d);
    usedWidth = Math.max(usedWidth, x);
  }

  const siteWidthFt = Math.min(MAX_WIDTH_FT, usedWidth || 0);
  const siteLengthFt = y + rowHeight;
  const siteAreaSqFt = siteWidthFt * siteLengthFt;

  return { placements, siteWidthFt, siteLengthFt, siteAreaSqFt };
}

function computeAll(rawCounts) {
  const counts = normalizeCounts(rawCounts);
  const { totalCost, totalEnergyMWh } = computeTotals(counts);
  const rects = expandRectangles(counts);
  const { placements, siteWidthFt, siteLengthFt, siteAreaSqFt } = packLayout(rects);

  const energyDensity = siteAreaSqFt > 0 ? (totalEnergyMWh / siteAreaSqFt) : 0;

  return {
    counts,
    totals: { totalCost, totalEnergyMWh, energyDensity },
    layout: { placements, siteWidthFt, siteLengthFt, siteAreaSqFt, maxWidthFt: MAX_WIDTH_FT }
  };
}

// --- API ---
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    auth: true,
    time: new Date().toISOString()
  });
});

app.get("/api/catalog", (req, res) => res.json({ catalog: CATALOG }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (name.length > 80) {
      return res.status(400).json({ error: "Name is too long" });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Account already exists" });

    const passwordHash = hashPassword(password);
    const id = nanoid(12);
    const user = await createUserWithName({ id, email, name, passwordHash });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name ?? null } });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "Account already exists" });
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await getUserByEmail(email);
    const ok = user ? verifyPassword(password, user.passwordHash) : false;
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name ?? null } });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/compute", (req, res) => {
  try {
    const result = computeAll(req.body?.counts ?? {});
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/sessions", requireAuth, async (req, res) => {
  try {
    res.json({ sessions: await listSessions(req.user.id) });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.post("/api/sessions", requireAuth, async (req, res) => {
  try {
    const rawName = req.body?.name ?? null;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) return res.status(400).json({ error: "Session name is required" });
    const counts = req.body?.counts ?? {};
    const computed = computeAll(counts);

    const id = nanoid(10);
    await createSession({ id, userId: req.user.id, name, payload: computed });
    res.json({ id });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Session name already exists" });
    }
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/sessions/:id", requireAuth, async (req, res) => {
  try {
    const s = await getSession(req.user.id, req.params.id);
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.put("/api/sessions/:id", requireAuth, async (req, res) => {
  try {
    const rawName = req.body?.name ?? null;
    const name = typeof rawName === "string" && rawName.trim() === "" ? null : rawName;
    const counts = req.body?.counts ?? {};
    const computed = computeAll(counts);

    const updated = await updateSession(req.user.id, req.params.id, { name, payload: computed });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Session name already exists" });
    }
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.delete("/api/sessions/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await deleteSession(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json(deleted);
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

// --- serve built client in prod ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// if (process.env.NODE_ENV === "production") {
//   const clientDist = path.join(__dirname, "..", "client", "dist");
//   app.use(express.static(clientDist));
//   app.get("/*", (req, res) => res.sendFile(path.join(clientDist, "index.html")));
// }

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
