import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import agentsRoutes from "./routes/agents.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import vehiclesRoutes from "./routes/vehicles.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import invoicesRoutes from "./routes/invoices.routes.js";
import ratePlansRoutes from "./routes/ratePlans.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import damageRoutes from "./routes/damage.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 5001;

// CORS
app.use(cors({ origin: true, credentials: true }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logger
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("➡️", req.method, req.originalUrl);
    next();
  });
}

// Root + health
app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome KeyTurn API is running" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/rate-plans", ratePlansRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/damage-reports", damageRoutes);
app.use("/api/analytics", analyticsRoutes);

// Test protected
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥", err);
  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: err.message || "Server error",
    code: err.code,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Listen
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
