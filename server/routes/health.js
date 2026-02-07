import { Router } from "express";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", (req, res) => {
    res.json({
      ok: true,
      auth: true,
      time: new Date().toISOString()
    });
  });

  return router;
}

