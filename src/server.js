require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");

const PORT = parseInt(process.env.PORT) || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`   Server  : http://localhost:${PORT}`);
    console.log(`   Docs    : http://localhost:${PORT}/api-docs`);
    console.log(`   Health  : http://localhost:${PORT}/api/v1/health`);
    console.log(`   Env     : ${process.env.NODE_ENV || "development"}\n`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (err) => {
    console.error("💥 Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });
};

start();
