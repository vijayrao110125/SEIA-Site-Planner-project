import test from "node:test";
import assert from "node:assert/strict";

import { computeAll } from "../dist/services/compute.js";

test("computeAll derives transformers as ceil(batteries/2)", () => {
  const res = computeAll({ Megapack: 3, PowerPack: 0, Megapack2: 0, MegapackXL: 0, Transformer: 999 });
  assert.equal(res.counts.Transformer, 2);
});

test("layout max width is 100ft", () => {
  const res = computeAll({ Megapack: 1 });
  assert.equal(res.layout.maxWidthFt, 100);
});

