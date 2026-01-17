import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.routes.js";
import agentsRoutes from "./routes/agents.routes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 5001;


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Routes
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/agents", agentsRoutes);

// Debug router info (optional)
console.log("authRoutes type:", typeof authRoutes);
console.log("authRoutes keys:", Object.keys(authRoutes));
console.log("authRoutes isRouter stack length:", authRoutes?.stack?.length);

// Protected route example
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "This is a protected route",
    user: req.user,
  });
});

// ✅ Error handling middleware (must NOT call next after responding)
app.use((err, req, res, next) => {
  console.error("🔥", err);

  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: err.message,
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

// ✅ ONE listen only (at the end)
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} already in use. Kill the old node process.`);
    process.exit(1);
  }
});

export default app;


