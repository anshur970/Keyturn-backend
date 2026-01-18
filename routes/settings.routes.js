import express from "express";
import prisma from "../lib/prisma.js";

import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roles.js";

const router = express.Router();

// GET /api/settings
router.get("/", requireAuth, requireRole("admin", "agent"), async (req, res, next) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    res.json({ settings });
  } catch (e) {
    next(e);
  }
});

// PUT /api/settings (admin only)
router.put("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) settings = await prisma.settings.create({ data: {} });

    const updated = await prisma.settings.update({
      where: { id: settings.id },
      data: req.body,
    });

    res.json({ settings: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
