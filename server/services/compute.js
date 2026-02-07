import { BATTERY_TYPES, CATALOG } from "../catalog.js";
import { MAX_WIDTH_FT } from "../config.js";

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
  rects.sort((a, b) => b.w * b.d - a.w * a.d);
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

export function computeAll(rawCounts) {
  const counts = normalizeCounts(rawCounts);
  const { totalCost, totalEnergyMWh } = computeTotals(counts);
  const rects = expandRectangles(counts);
  const { placements, siteWidthFt, siteLengthFt, siteAreaSqFt } = packLayout(rects);

  const energyDensity = siteAreaSqFt > 0 ? totalEnergyMWh / siteAreaSqFt : 0;

  return {
    counts,
    totals: { totalCost, totalEnergyMWh, energyDensity },
    layout: { placements, siteWidthFt, siteLengthFt, siteAreaSqFt, maxWidthFt: MAX_WIDTH_FT }
  };
}

