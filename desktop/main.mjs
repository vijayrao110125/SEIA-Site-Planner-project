import { app, BrowserWindow } from "electron";
import path from "path";
import { pathToFileURL } from "url";

const DEV_RENDERER_URL = process.env.ELECTRON_DEV_URL || "http://127.0.0.1:8000";
const IS_DEV = !app.isPackaged;

async function startEmbeddedApiServer() {
  const modUrl = new URL("../server/dist/createApp.js", import.meta.url);
  const { createApp } = await import(modUrl.href);
  const apiApp = createApp();

  return await new Promise((resolve, reject) => {
    const server = apiApp.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      const apiBase = `http://127.0.0.1:${port}`;
      resolve({ server, apiBase });
    });
    server.on("error", reject);
  });
}

function createMainWindow({ preloadPath }) {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    backgroundColor: "#0F1B2A",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  return win;
}

async function bootstrap() {
  let embeddedServer = null;
  let apiBase = "";

  if (IS_DEV) {
    apiBase = process.env.SEIA_API_BASE || "";
  } else {
    const started = await startEmbeddedApiServer();
    embeddedServer = started.server;
    apiBase = started.apiBase;
  }

  process.env.SEIA_API_BASE = apiBase;

  const preloadPath = path.join(app.getAppPath(), "desktop", "preload.mjs");
  const win = createMainWindow({ preloadPath });

  if (IS_DEV) {
    await win.loadURL(DEV_RENDERER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = path.join(app.getAppPath(), "client", "dist", "index.html");
    await win.loadURL(pathToFileURL(indexPath).href);
  }

  app.on("before-quit", () => {
    try {
      embeddedServer?.close?.();
    } catch {
      // ignore
    }
  });
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) bootstrap();
});

