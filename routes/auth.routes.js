// routes/auth.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

const router = Router();

/**
 * Helpers
 */
function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function isTokenRevoked(token) {
  if (!token) return false;
  const exists = await prisma.tokenBlacklist.findUnique({ where: { token } });
  return !!exists;
}

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role must match Prisma enum: admin | agent | customer
    const finalRole = role && ["admin", "agent", "customer"].includes(role) ? role : "customer";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: finalRole,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "JWT_SECRET is not set" });
    }

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret, { expiresIn: "7d" });

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user,
    });
  } catch (e) {
    return next(e);
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "JWT_SECRET is not set" });
    }

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret, { expiresIn: "7d" });

    return res.status(200).json({
      message: "Logged in successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    return next(e);
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing Authorization header" });
    }

    if (await isTokenRevoked(token)) {
      return res.status(401).json({ success: false, message: "Token has been revoked" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "JWT_SECRET is not set" });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = payload?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (e) {
    return next(e);
  }
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(200).json({ message: "Logged out successfully" });
    }

    const exists = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (exists) {
      return res.status(200).json({ message: "Logged out successfully" });
    }

    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object" && decoded.exp) {
      expiresAt = new Date(Number(decoded.exp) * 1000);
    }

    await prisma.tokenBlacklist.create({
      data: { token, expiresAt },
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    return next(e);
  }
});

export default router;
