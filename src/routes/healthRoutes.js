const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { sendSuccess } = require("../utils/response");

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Check API and database health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: "healthy" }
 *                     uptime: { type: number, example: 3600.12 }
 *                     timestamp: { type: string, format: date-time }
 *                     database:
 *                       type: object
 *                       properties:
 *                         status: { type: string, example: "connected" }
 *                         name: { type: string, example: "digital-registry" }
 *                     environment: { type: string, example: "development" }
 *                     version: { type: string, example: "1.0.0" }
 */
router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown";

  sendSuccess(res, {
    message: "OK",
    data: {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || "n/a",
      },
      environment: process.env.NODE_ENV || "development",
      version: require("../../package.json").version,
    },
  });
});

module.exports = router;
