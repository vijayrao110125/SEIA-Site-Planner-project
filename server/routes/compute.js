import { Router } from "express";
import { computeAll } from "../services/compute.js";

export function createComputeRouter() {
  const router = Router();

  router.post("/compute", (req, res) => {
    try {
      const result = computeAll(req.body?.counts ?? {});
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: String(e?.message ?? e) });
    }
  });

  return router;
}

