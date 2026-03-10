// src/routes/index.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const { classifyProduct, CATEGORIES, SUSTAINABILITY_FILTERS } = require("../modules/catalog/catalogModule");
const { generateProposal } = require("../modules/proposal/proposalModule");
const Database = require("../services/database");
const Logger = require("../utils/logger");
const { handleValidationError } = require("../middleware/errorHandler");

const router = express.Router();

// ─── Health Check ───────────────────────────
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── MODULE 1: Classify Product ─────────────
router.post(
  "/catalog/classify",
  [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return handleValidationError(errors, res);

    const result = await classifyProduct(req.body);
    if (!result.success) return res.status(502).json({ success: false, error: result.error });

    res.status(201).json({ success: true, data: result.data, warnings: result.warnings });
  }
);

// Get all classified products
router.get("/catalog/products", async (req, res) => {
  try {
    const data = await Database.getProducts();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get categories + filters reference
router.get("/catalog/meta", (req, res) => {
  res.json({ success: true, data: { categories: CATEGORIES, sustainability_filters: SUSTAINABILITY_FILTERS } });
});

// ─── MODULE 2: Generate Proposal ────────────
router.post(
  "/proposals/generate",
  [
    body("clientName").trim().notEmpty().withMessage("Client name is required"),
    body("industry").trim().notEmpty().withMessage("Industry is required"),
    body("orderQty").isInt({ min: 1 }).withMessage("Order quantity must be a positive integer"),
    body("budget").optional().isFloat({ min: 1 }).withMessage("Budget must be a positive number"),
    body("goals").optional().trim(),
    body("productIds").optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return handleValidationError(errors, res);

    const result = await generateProposal(req.body);
    if (!result.success) return res.status(502).json({ success: false, error: result.error });

    res.status(201).json({ success: true, data: result.data, warnings: result.warnings });
  }
);

// Get all proposals
router.get("/proposals", async (req, res) => {
  try {
    const data = await Database.getProposals();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Logs & Stats ────────────────────────────
router.get("/logs", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ success: true, data: Logger.getRecentLogs(limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const data = await Database.getStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;