import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

import { CATALOG, BATTERY_TYPES } from "./catalog.js";
import { createSession, listSessions, getSession, updateSession, deleteSession } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const MAX_WIDTH_FT = 100;

// --- helpers ---
function clampNonNegInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
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
app.get("/api/catalog", (req, res) => res.json({ catalog: CATALOG }));

app.post("/api/compute", (req, res) => {
  try {
    const result = computeAll(req.body?.counts ?? {});
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    res.json({ sessions: await listSessions() });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.post("/api/sessions", async (req, res) => {
  try {
    const name = req.body?.name ?? null;
    const counts = req.body?.counts ?? {};
    const computed = computeAll(counts);

    const id = nanoid(10);
    await createSession({ id, name, payload: computed });
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.get("/api/sessions/:id", async (req, res) => {
  try {
    const s = await getSession(req.params.id);
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.put("/api/sessions/:id", async (req, res) => {
  try {
    const name = req.body?.name ?? null;
    const counts = req.body?.counts ?? {};
    const computed = computeAll(counts);

    const updated = await updateSession(req.params.id, { name, payload: computed });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.delete("/api/sessions/:id", async (req, res) => {
  try {
    const deleted = await deleteSession(req.params.id);
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
