import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { createApp } from "../dist/createApp.js";

async function checkCanListen() {
  const server = http.createServer((_req, res) => res.end("ok"));
  try {
    await new Promise((resolve, reject) => {
      server.listen(0, "127.0.0.1");
      server.once("listening", resolve);
      server.once("error", reject);
    });
    return true;
  } catch {
    return false;
  } finally {
    try {
      await new Promise((resolve) => server.close(resolve));
    } catch {
      // ignore
    }
  }
}

const CAN_LISTEN = await checkCanListen();

async function withServer(fn) {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1");
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : null;
  assert.ok(port, "Expected server to listen on a port");

  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET /api/health returns ok", async (t) => {
  if (!CAN_LISTEN) return t.skip("Listening on localhost is not permitted in this environment");
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body?.ok, true);
  });
});

test("GET /api/catalog returns catalog", async (t) => {
  if (!CAN_LISTEN) return t.skip("Listening on localhost is not permitted in this environment");
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/catalog`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body?.catalog && typeof body.catalog === "object");
    assert.ok(typeof body.catalog.Megapack === "object");
  });
});

test("POST /api/compute derives transformers", async (t) => {
  if (!CAN_LISTEN) return t.skip("Listening on localhost is not permitted in this environment");
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/compute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ counts: { Megapack: 3 } })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body?.counts?.Transformer, 2);
  });
});
