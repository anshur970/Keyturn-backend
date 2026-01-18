// routes/reservations.routes.js
import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/reservations?status=&vehicleId=&customerId=
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, vehicleId, customerId } = req.query;

    const reservations = await prisma.reservation.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        ...(customerId ? { customerId } : {}),
      },
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            status: true,
            dailyRate: true,
            category: true,
          },
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            driverLicense: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reservations });
  } catch (e) {
    next(e);
  }
});

// POST /api/reservations
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { vehicleId, customerId, startDate, endDate, notes } = req.body || {};
    if (!vehicleId || !customerId || !startDate || !endDate) {
      return res.status(400).json({
        message: "vehicleId, customerId, startDate, endDate are required",
      });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (vehicle.status !== "available") {
      return res.status(409).json({ message: "Vehicle is not available" });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const created = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          vehicleId,
          customerId,
          customerName: customer.fullName,
          customerPhone: customer.phone || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          notes: notes || null,
          status: "active",
        },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: "rented" },
      });

      return reservation;
    });

    const reservation = await prisma.reservation.findUnique({
      where: { id: created.id },
      include: { vehicle: true, customer: true },
    });

    res.status(201).json({ reservation });
  } catch (e) {
    next(e);
  }
});

// PUT /api/reservations/:id
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: updates.customerId },
      });
      if (!customer) return res.status(404).json({ message: "Customer not found" });

      updates.customerName = customer.fullName;
      updates.customerPhone = customer.phone || null;
    }

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: updates,
      include: { vehicle: true, customer: true },
    });

    res.json({ reservation });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ message: "Reservation not found" });
    }
    next(e);
  }
});

// DELETE /api/reservations/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
    });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "cancelled" },
      });

      await tx.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: "available" },
      });
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
