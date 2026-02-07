import { AUTH_TOKEN_KEY } from "../config.js";
import { getUserById } from "../db.js";
import { getTokenFromReq, verifyToken } from "../auth/tokens.js";

export function requireAuthFactory({ secret = AUTH_TOKEN_KEY } = {}) {
  return async function requireAuth(req: any, res: any, next: any) {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ error: "Unauthorized" });
      const payload = verifyToken({ token, secret });
      if (!payload) return res.status(401).json({ error: "Unauthorized" });
      const userId = payload?.sub;
      if (typeof userId !== "string" || !userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await getUserById(userId);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      req.user = { id: user.id, email: user.email, name: user.name ?? null };
      next();
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}

