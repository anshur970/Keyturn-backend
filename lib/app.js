import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "../routes/auth.routes.js";
import vehicleRoutes from "../routes/vehicles.routes.js";
import reservationRoutes from "../routes/reservations.routes.js";
import customerRoutes from "../routes/customers.routes.js";
import agentRoutes from "../routes/agents.routes.js";
import damageRoutes from "../routes/damage.routes.js";
import invoiceRoutes from "../routes/invoices.routes.js";
import ratePlanRoutes from "../routes/ratePlans.routes.js";
import analyticsRoutes from "../routes/analytics.routes.js";
import settingsRoutes from "../routes/settings.routes.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

import { notFound, errorHandler } from "../middleware/error.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: true,
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true, name: "keyturn-api" }));

app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/damage-reports", damageRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/rate-plans", ratePlanRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
