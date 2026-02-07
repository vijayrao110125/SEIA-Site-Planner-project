import { spawn } from "child_process";
import fs from "fs";
import path from "path";

function resolveBin(name) {
  const bin = process.platform === "win32" ? `${name}.cmd` : name;
  const local = path.join(process.cwd(), "node_modules", ".bin", bin);
  if (fs.existsSync(local)) return local;
  return bin;
}

const tscBin = resolveBin("tsc");

let serverProc = null;
let restartTimer = null;

function startServer() {
  if (serverProc) return;
  serverProc = spawn(process.execPath, ["dist/index.js"], { stdio: "inherit" });
  serverProc.on("exit", (code, signal) => {
    serverProc = null;
    if (signal) return;
    if (typeof code === "number" && code !== 0) {
      // leave it stopped until next successful compilation
    }
  });
}

function stopServer() {
  if (!serverProc) return;
  try {
    serverProc.kill("SIGTERM");
  } catch {
    // ignore
  }
  serverProc = null;
}

function scheduleRestart() {
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    stopServer();
    startServer();
  }, 150);
}

const tsc = spawn(tscBin, ["-p", "tsconfig.json", "-w", "--preserveWatchOutput"], {
  stdio: ["ignore", "pipe", "pipe"]
});

function onLine(line) {
  const s = String(line);
  // When compilation succeeds, TypeScript prints "Found 0 errors. Watching for file changes."
  if (s.includes("Found 0 errors")) {
    if (!serverProc) startServer();
    else scheduleRestart();
  }
}

for (const stream of [tsc.stdout, tsc.stderr]) {
  let buf = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    process.stdout.write(chunk);
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      onLine(line);
    }
  });
}

tsc.on("exit", (code) => {
  stopServer();
  process.exit(code ?? 1);
});

process.on("SIGINT", () => {
  stopServer();
  try {
    tsc.kill("SIGINT");
  } catch {
    // ignore
  }
  process.exit(0);
});

