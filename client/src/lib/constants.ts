export const BATTERY_TYPES = ["MegapackXL", "Megapack2", "Megapack", "PowerPack"] as const;

export const AUTH_TOKEN_KEY = "seia:token";
export const THEME_KEY = "seia:theme";
export const PARTICLES_KEY = "seia:particles";

export const lastSessionKey = (userId?: string | null) => `seia:lastSessionId:${userId || "anon"}`;

export const EMPTY_COUNTS: Record<(typeof BATTERY_TYPES)[number], number> = {
  MegapackXL: 0,
  Megapack2: 0,
  Megapack: 0,
  PowerPack: 0
};

export const API_BASE = (import.meta.env.VITE_API_BASE || "").trim().replace(/\/+$/, "");
export const API_FETCH_TIMEOUT_MS = 10000;

export const LAYOUT_TYPE_STYLE = {
  MegapackXL: {
    light: { top: "#f2f2f2", front: "#e0e0e0", side: "#cfcfcf" },
    dark: { top: "#2b2b2b", front: "#1f1f1f", side: "#141414" }
  },
  Megapack2: {
    light: { top: "#f7f7f7", front: "#e9e9e9", side: "#d9d9d9" },
    dark: { top: "#333333", front: "#262626", side: "#1a1a1a" }
  },
  Megapack: {
    light: { top: "#ffffff", front: "#ededed", side: "#dddddd" },
    dark: { top: "#3a3a3a", front: "#2c2c2c", side: "#1f1f1f" }
  },
  PowerPack: {
    light: { top: "#f5f5f5", front: "#e6e6e6", side: "#d6d6d6" },
    dark: { top: "#3b3b3b", front: "#2e2e2e", side: "#1f1f1f" }
  },
  Transformer: {
    light: { top: "#e31b23", front: "#c9151c", side: "#a90f15" },
    dark: { top: "#e31b23", front: "#c9151c", side: "#a90f15" }
  }
} as const;

