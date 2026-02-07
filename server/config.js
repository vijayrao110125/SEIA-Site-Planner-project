import "./env.js";

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || 3001;

export const MAX_WIDTH_FT = 100;
export const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const AUTH_TOKEN_KEY = process.env.AUTH_TOKEN_KEY || "dev-insecure-secret";
if (!process.env.AUTH_TOKEN_KEY && NODE_ENV === "production") {
  console.warn("WARNING: AUTH_TOKEN_KEY is not set; using insecure default");
}

