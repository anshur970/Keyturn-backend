import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    // ✅ Verify token first (so payload is available)
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ If this is logout, DO NOT block even if revoked
    // (logout should be idempotent)
    if (req.originalUrl.startsWith("/api/auth/logout")) {
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      req.token = token;
      return next();
    }

    // 🔒 For all other routes: block revoked tokens
    const blacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (blacklisted) {
      return res.status(401).json({ message: "Token has been revoked" });
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    req.token = token;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
