import { Router } from "express";
import { nanoid } from "nanoid";
import { AUTH_TOKEN_KEY } from "../config.js";
import { createUserWithName, getUserByEmail } from "../db.js";
import { hashPassword, verifyPassword } from "../auth/passwords.js";
import { signToken } from "../auth/tokens.js";
import { requireAuthFactory } from "../middleware/requireAuth.js";

export function createAuthRouter({ secret = AUTH_TOKEN_KEY } = {}) {
  const router = Router();
  const requireAuth = requireAuthFactory({ secret });

  router.post("/auth/register", async (req, res) => {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      if (name.length > 80) {
        return res.status(400).json({ error: "Name is too long" });
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: "Valid email is required" });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const existing = await getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Account already exists" });

      const passwordHash = hashPassword(password);
      const id = nanoid(12);
      const user = await createUserWithName({ id, email, name, passwordHash });
      const token = signToken({ user, secret });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name ?? null } });
    } catch (e: any) {
      if (e?.code === 11000) return res.status(409).json({ error: "Account already exists" });
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  router.post("/auth/login", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      const user = await getUserByEmail(email);
      const ok = user ? verifyPassword(password, user.passwordHash) : false;
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken({ user, secret });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name ?? null } });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  router.get("/auth/me", requireAuth, async (req, res) => {
    res.json({ user: (req as any).user });
  });

  return router;
}

