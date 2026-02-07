import { Router } from "express";
import { CATALOG } from "../catalog.js";

export function createCatalogRouter() {
  const router = Router();
  router.get("/catalog", (req, res) => res.json({ catalog: CATALOG }));
  return router;
}

