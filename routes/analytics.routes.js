import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// GET /api/analytics/summary
router.get("/summary", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const [vehicles, reservations, invoices, activeReservations, availableVehicles] = await Promise.all([
      prisma.vehicle.count(),
      prisma.reservation.count(),
      prisma.invoice.count(),
      prisma.reservation.count({ where: { status: "active" } }),
      prisma.vehicle.count({ where: { status: "available" } }),
    ]);

    const paidAgg = await prisma.invoice.aggregate({
      where: { status: "paid" },
      _sum: { total: true },
    });

    const totalRevenue = paidAgg?._sum?.total || 0;

    res.json({
      vehicles,
      reservations,
      invoices,
      activeReservations,
      availableVehicles,
      totalRevenue,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
