import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roles.js";

const router = express.Router();

// GET /api/rate-plans?active=true|false
router.get("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const { active } = req.query;

    const ratePlans = await prisma.ratePlan.findMany({
      where:
        active === "true" ? { active: true } : active === "false" ? { active: false } : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json({ ratePlans });
  } catch (e) {
    next(e);
  }
});

// POST /api/rate-plans (admin only)
router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const ratePlan = await prisma.ratePlan.create({ data: req.body });
    res.status(201).json({ ratePlan });
  } catch (e) {
    next(e);
  }
});

// PUT /api/rate-plans/:id (admin only)
router.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const ratePlan = await prisma.ratePlan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ ratePlan });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Rate plan not found" });
    next(e);
  }
});

// DELETE /api/rate-plans/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.ratePlan.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Rate plan not found" });
    next(e);
  }
});

export default router;
