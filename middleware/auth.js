import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    // Verify token first
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Allow logout even if token already revoked
    if (req.method === "POST" && req.path === "/logout") {
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      req.token = token;
      return next();
    }

    // Block revoked tokens for all other routes
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
