// src/index.js — Express Server Entry Point
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const routes = require("./routes");
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorHandler");
const Logger = require("./utils/logger");

const app = express();

// ── Middleware ──
app.use(cors({ origin: config.server.frontendUrl, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ── Routes ──
app.use("/api", routes);

// ── Error Handling ──
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start ──
const { connect } = require("./services/mongoClient");

connect()
  .then(() => {
    app.listen(config.server.port, () => {
      Logger.info("EcoAI backend running", { port: config.server.port, env: config.server.env });
      console.log(`\n🌿 EcoAI Backend running at http://localhost:${config.server.port}`);
      console.log(`📋 API Base: http://localhost:${config.server.port}/api\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
