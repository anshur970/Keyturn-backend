import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// GET /api/customers?q=
router.get("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const { q } = req.query;

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { driverLicense: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json({ customers });
  } catch (e) {
    next(e);
  }
});

// GET /api/customers/:id
router.get("/:id", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ customer });
  } catch (e) {
    next(e);
  }
});

// POST /api/customers
router.post("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const created = await prisma.customer.create({ data: req.body });
    res.status(201).json({ customer: created });
  } catch (e) {
    next(e);
  }
});

// PUT /api/customers/:id
router.put("/:id", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ customer: updated });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Customer not found" });
    next(e);
  }
});

// DELETE /api/customers/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ message: "Customer not found" });
    next(e);
  }
});

export default router;
