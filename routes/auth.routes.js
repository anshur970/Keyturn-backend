import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

console.log("✅ auth.routes.js loaded");

const router = express.Router();

function signToken(user) {
  // Your requireAuth reads: payload.sub, payload.email, payload.role
  return jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

function getExpiryDateFromToken(token) {
  const decoded = jwt.decode(token); // no verify; just read exp
  if (!decoded?.exp) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Date(decoded.exp * 1000);
}

/**
 * POST /api/auth/register
 * body: { name, email, password }
 * Creates an ADMIN by default (because your schema default is admin),
 * but we’ll explicitly set role: "admin" here to match your usage.
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }

    const lower = String(email).trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lower } });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: lower,
        passwordHash,
        role: "admin", // so you can access /api/agents right away
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = signToken(user);

    res.status(201).json({
      message: "Registered successfully",
      token,
      user,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email, password required" });
    }

    const lower = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: lower },
      select: { id: true, name: true, email: true, role: true, passwordHash: true, createdAt: true },
    });

    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user);

    res.json({
      message: "Logged in successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 * Adds token to TokenBlacklist with expiresAt so it’s blocked until it expires.
 */
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.token;

    const expiresAt = getExpiryDateFromToken(token);

    await prisma.tokenBlacklist.create({
      data: {
        token,
        expiresAt,
      },
    });

    res.json({ message: "Logged out successfully" });
  } catch (e) {
    // token unique constraint: if already blacklisted, treat as success
    if (e?.code === "P2002") return res.json({ message: "Logged out successfully" });
    next(e);
  }
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

export default router;
