// src/config/index.js
// ─────────────────────────────────────────
//  Central config — reads from .env
//  NEVER hardcode keys anywhere else
// ─────────────────────────────────────────
require("dotenv").config();

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

const config = {
  server: {
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  gemini: {
    apiKey: required("GEMINI_API_KEY"),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    maxOutputTokens: 8192,
    temperature: 0.3,
  },
  mongo: {
    uri: required("MONGO_URI"),   
    dbName: "ecoai",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    dir: process.env.LOG_DIR || "./logs",
  },
};

module.exports = config;
