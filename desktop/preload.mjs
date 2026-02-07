import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("__SEIA_API_BASE__", process.env.SEIA_API_BASE || "");

