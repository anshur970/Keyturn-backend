import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// GET /api/vehicles?status=&category=&q=
router.get("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const { status, category, q } = req.query;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        ...(q
          ? {
              OR: [
                { make: { contains: q, mode: "insensitive" } },
                { model: { contains: q, mode: "insensitive" } },
                { licensePlate: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ vehicles });
  } catch (e) {
    next(e);
  }
});

// GET /api/vehicles/:id
router.get("/:id", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ vehicle });
  } catch (e) {
    next(e);
  }
});

// POST /api/vehicles  (admin only)
router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const created = await prisma.vehicle.create({ data: req.body });
    res.status(201).json({ vehicle: created });
  } catch (e) {
    // unique licensePlate
    if (e?.code === "P2002") return res.status(409).json({ message: "License plate already exists" });
    next(e);
  }
});

// PUT /api/vehicles/:id (admin only)
router.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ vehicle: updated });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Vehicle not found" });
    next(e);
  }
});

// DELETE /api/vehicles/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Vehicle not found" });
    next(e);
  }
});

export default router;
