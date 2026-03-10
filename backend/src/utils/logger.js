// src/utils/logger.js
// ─────────────────────────────────────────
//  Structured logger for all AI calls
//  Logs: module, prompt, response, status
// ─────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const config = require("../config");

// Ensure log directory exists
if (!fs.existsSync(config.logging.dir)) {
  fs.mkdirSync(config.logging.dir, { recursive: true });
}

const logFile = path.join(config.logging.dir, `ai-calls-${new Date().toISOString().slice(0,10)}.log`);

function writeToFile(entry) {
  const line = JSON.stringify(entry) + "\n";
  fs.appendFileSync(logFile, line, "utf8");
}

const Logger = {
  // Log every AI API call
  aiCall({ module, prompt, response, status, error = null, durationMs = 0 }) {
    const entry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      module,
      status,          // "OK" | "WARN" | "ERROR"
      durationMs,
      prompt_length: prompt?.length || 0,
      prompt_preview: prompt?.slice(0, 150) + "...",
      response_preview: typeof response === "object"
        ? JSON.stringify(response).slice(0, 150) + "..."
        : String(response || "").slice(0, 150),
      error: error || null,
    };
    writeToFile(entry);
    if (config.server.env === "development") {
      const icon = { OK: "✓", WARN: "⚠", ERROR: "✗" }[status] || "·";
      console.log(`[${icon} ${module}] ${durationMs}ms | ${status}${error ? " | " + error : ""}`);
    }
    return entry;
  },

  // General app logs
  info: (msg, data = {}) => {
    const entry = { level: "INFO", timestamp: new Date().toISOString(), msg, ...data };
    writeToFile(entry);
    if (config.server.env === "development") console.log(`[INFO] ${msg}`, data);
  },

  error: (msg, err) => {
    const entry = { level: "ERROR", timestamp: new Date().toISOString(), msg, error: err?.message };
    writeToFile(entry);
    console.error(`[ERROR] ${msg}`, err?.message);
  },

  // Read recent logs (for API endpoint)
  getRecentLogs(limit = 50) {
    try {
      const content = fs.readFileSync(logFile, "utf8");
      return content.trim().split("\n")
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .reverse()
        .slice(0, limit);
    } catch {
      return [];
    }
  },
};

module.exports = Logger;
