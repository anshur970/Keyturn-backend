// routes/invoices.routes.js
import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// GET /api/invoices?status=
router.get("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const { status } = req.query;
    const invoices = await prisma.invoice.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json({ invoices });
  } catch (e) {
    next(e);
  }
});

// GET /api/invoices/:id
router.get("/:id", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ invoice });
  } catch (e) {
    next(e);
  }
});

// POST /api/invoices/from-reservation/:reservationId
router.post("/from-reservation/:reservationId", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.reservationId },
      include: { vehicle: true, customer: true },
    });

    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const v = reservation.vehicle;
    const vehicleLabel = v ? `${v.make} ${v.model} ${v.year} (${v.licensePlate})` : "";

    const dailyRate = Number(v?.dailyRate ?? 0);

    const ms = new Date(reservation.endDate) - new Date(reservation.startDate);
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const subtotal = days * dailyRate;

    const tax = Number(req.body?.tax ?? 0);
    const discount = Number(req.body?.discount ?? 0);
    const total = Math.max(0, subtotal + tax - discount);

    // ✅ safer snapshot of customer name (works with different schemas)
    const customerName =
      reservation.customerName ??
      reservation.customer?.fullName ??
      reservation.customer?.name ??
      "";

    const invoice = await prisma.invoice.create({
      data: {
        reservationId: reservation.id,
        customerName, // snapshot
        vehicleLabel,
        subtotal,
        tax,
        discount,
        total,
        status: "draft",
        notes: req.body?.notes || null,
      },
    });

    res.status(201).json({ invoice });
  } catch (e) {
    next(e);
  }
});

// PUT /api/invoices/:id
router.put("/:id", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // If marking paid, set paidAt automatically (optional convenience)
    if (updates.status === "paid" && !updates.paidAt) {
      updates.paidAt = new Date();
    }
    if (updates.paidAt) updates.paidAt = new Date(updates.paidAt);
    if (updates.issuedAt) updates.issuedAt = new Date(updates.issuedAt);

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ invoice });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Invoice not found" });
    next(e);
  }
});

// DELETE /api/invoices/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Invoice not found" });
    next(e);
  }
});

export default router;
