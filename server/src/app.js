require("express-async-errors");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const prisma = require("./lib/prisma");
const prismaAdmin = require("./lib/prismaAdmin");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/warmup", async (req, res) => {
  // Opens a connection on both pools, which also wakes the database.
  await Promise.all([
    prisma.$queryRaw`SELECT 1`,
    prismaAdmin.$queryRaw`SELECT 1`,
  ]);
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", shipmentRoutes);
app.use("/api", trackingRoutes);

// Catches any error thrown in a route handler, so the client gets a
// response instead of a hung request.
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

module.exports = app;
