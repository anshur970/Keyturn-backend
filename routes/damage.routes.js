import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// GET /api/damage-reports?status=&severity=&vehicleId=
router.get("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const { status, severity, vehicleId } = req.query;

    const reports = await prisma.damageReport.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
        ...(vehicleId ? { vehicleId } : {}),
      },
      include: {
        vehicle: { select: { make: true, model: true, year: true, licensePlate: true, status: true } },
        reservation: { select: { id: true, customerName: true, startDate: true, endDate: true, status: true } },
        reportedBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reports });
  } catch (e) {
    next(e);
  }
});

// POST /api/damage-reports
router.post("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // link to the currently logged-in user
    payload.reportedByUserId = req.user.id;

    if (payload.occurredAt) payload.occurredAt = new Date(payload.occurredAt);

    const report = await prisma.damageReport.create({
      data: payload,
      include: { vehicle: true, reservation: true, reportedBy: true },
    });

    res.status(201).json({ report });
  } catch (e) {
    next(e);
  }
});

// PUT /api/damage-reports/:id
router.put("/:id", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.occurredAt) updates.occurredAt = new Date(updates.occurredAt);

    const report = await prisma.damageReport.update({
      where: { id: req.params.id },
      data: updates,
      include: { vehicle: true, reservation: true, reportedBy: true },
    });

    res.json({ report });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Damage report not found" });
    next(e);
  }
});

// DELETE /api/damage-reports/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.damageReport.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Damage report not found" });
    next(e);
  }
});

export default router;
