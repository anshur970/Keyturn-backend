import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// GET /api/agents (admin only)
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: "agent" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ agents });
  } catch (e) {
    next(e);
  }
});

// POST /api/agents (admin only)
router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "name, email, password required" });

    const lower = email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lower } });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const agent = await prisma.user.create({
      data: { name, email: lower, passwordHash, role: "agent" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ agent });
  } catch (e) {
    next(e);
  }
});

// PUT /api/agents/:id (admin only)
router.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.passwordHash;
    delete updates.role; // keep role controlled

    const agent = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (agent.role !== "agent") return res.status(400).json({ message: "User is not an agent" });
    res.json({ agent });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Agent not found" });
    next(e);
  }
});

// DELETE /api/agents/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== "agent") return res.status(404).json({ message: "Agent not found" });

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
