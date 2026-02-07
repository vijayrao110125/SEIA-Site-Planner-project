import { Router } from "express";
import { nanoid } from "nanoid";
import { AUTH_TOKEN_KEY } from "../config.js";
import { createSession, deleteSession, getSession, listSessions, updateSession } from "../db.js";
import { requireAuthFactory } from "../middleware/requireAuth.js";
import { computeAll } from "../services/compute.js";

export function createSessionsRouter({ secret = AUTH_TOKEN_KEY } = {}) {
  const router = Router();
  const requireAuth = requireAuthFactory({ secret });

  router.get("/sessions", requireAuth, async (req, res) => {
    try {
      res.json({ sessions: await listSessions(req.user.id) });
    } catch (e) {
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  router.post("/sessions", requireAuth, async (req, res) => {
    try {
      const rawName = req.body?.name ?? null;
      const name = typeof rawName === "string" ? rawName.trim() : "";
      if (!name) return res.status(400).json({ error: "Session name is required" });
      const counts = req.body?.counts ?? {};
      const computed = computeAll(counts);

      const id = nanoid(10);
      await createSession({ id, userId: req.user.id, name, payload: computed });
      res.json({ id });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ error: "Session name already exists" });
      }
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  router.get("/sessions/:id", requireAuth, async (req, res) => {
    try {
      const s = await getSession(req.user.id, req.params.id);
      if (!s) return res.status(404).json({ error: "Not found" });
      res.json(s);
    } catch (e) {
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  router.put("/sessions/:id", requireAuth, async (req, res) => {
    try {
      const rawName = req.body?.name ?? null;
      const name = typeof rawName === "string" && rawName.trim() === "" ? null : rawName;
      const counts = req.body?.counts ?? {};
      const computed = computeAll(counts);

      const updated = await updateSession(req.user.id, req.params.id, { name, payload: computed });
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ error: "Session name already exists" });
      }
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  router.delete("/sessions/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await deleteSession(req.user.id, req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json(deleted);
    } catch (e) {
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });

  return router;
}

