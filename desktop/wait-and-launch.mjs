import http from "http";
import https from "https";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const url = process.env.ELECTRON_DEV_URL || "http://127.0.0.1:8000";
const timeoutMs = Number(process.env.ELECTRON_WAIT_TIMEOUT_MS || 60_000);
const pollEveryMs = 500;

function requestOnce(targetUrl) {
  return new Promise((resolve) => {
    const lib = targetUrl.startsWith("https:") ? https : http;
    const req = lib.request(targetUrl, { method: "GET" }, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

async function waitForUrl(targetUrl, ms) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await requestOnce(targetUrl);
    if (ok) return;
    if (Date.now() - start > ms) throw new Error(`Timed out waiting for ${targetUrl}`);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, pollEveryMs));
  }
}

async function main() {
  console.log(`[ELECTRON] Waiting for renderer: ${url}`);
  await waitForUrl(url, timeoutMs);

  const electronBin = process.platform === "win32" ? "electron.cmd" : "electron";
  const electronPath = path.join(process.cwd(), "node_modules", ".bin", electronBin);
  if (!fs.existsSync(electronPath)) {
    throw new Error(
      `Electron binary not found at ${electronPath}. Run \`npm i\` at the repo root to install Electron.`
    );
  }

  console.log("[ELECTRON] Launching Electron...");
  const child = spawn(electronPath, ["desktop/main.mjs"], {
    stdio: "inherit",
    env: { ...process.env, ELECTRON_DEV_URL: url }
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
