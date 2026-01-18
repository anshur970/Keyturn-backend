import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import agentsRoutes from "./routes/agents.routes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 5001;

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("➡️", req.method, req.originalUrl);
    next();
  });
}

// Root + health for testing
app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome KeyTurn API is running" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" }); 
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentsRoutes);

// Protected route
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "This is a protected route",
    user: req.user,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥", err);

  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: err.message || "Server error",
    code: err.code,
    meta: err.meta,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Listen
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

});

export default app;
