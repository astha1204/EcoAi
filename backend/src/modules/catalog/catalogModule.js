// src/modules/catalog/catalogModule.js
// ─────────────────────────────────────────
//  Module 1: AI Auto-Category & Tag Generator
//  Business logic is SEPARATE from AI calls
// ─────────────────────────────────────────
const { v4: uuidv4 } = require("uuid");
const GeminiService = require("../../services/geminiService");
const Database = require("../../services/database");
const Logger = require("../../utils/logger");

// ── Business Constants (pure data, no AI) ──
const CATEGORIES = [
  "Packaging", "Office Supplies", "Cleaning Products", "Food & Beverage",
  "Personal Care", "Apparel & Textiles", "Electronics", "Furniture & Decor",
  "Agriculture & Gardening", "Healthcare", "Stationery", "Industrial Supplies","kitchen","Home & Living"
];

const SUSTAINABILITY_FILTERS = [
  "plastic-free", "compostable", "vegan", "recycled-content", "biodegradable",
  "zero-waste", "carbon-neutral", "organic-certified", "fair-trade", "upcycled",
];

// ── Prompt Builder (AI instruction, pure function) ──
function buildPrompt(name, description) {
  return `You are an AI catalog engine for a B2B sustainable products marketplace.
Analyze the product and return ONLY a valid JSON object. No markdown, no explanation.

STRICT RULES:
- primary_category must be exactly one of: ${CATEGORIES.join(", ")}
- sustainability_filters: pick only applicable ones from: ${SUSTAINABILITY_FILTERS.join(", ")}
- seo_tags: 5-10 lowercase hyphenated strings optimized for B2B procurement search
- confidence_score: float 0.0–1.0 based on how certain you are

Return this exact JSON structure:
{
  "primary_category": "",
  "sub_category": "",
  "seo_tags": [],
  "sustainability_filters": [],
  "confidence_score": 0.0,
  "reasoning": "1-2 sentence explanation"
}

Product Name: ${name}
Product Description: ${description}`;
}

// ── Validator (business rules, no AI) ──
function validate(data) {
  const errors = [];
  if (!CATEGORIES.includes(data.primary_category))
    errors.push(`Invalid category: "${data.primary_category}"`);
  if (!data.sub_category)
    errors.push("Missing sub_category");
  if (!Array.isArray(data.seo_tags) || data.seo_tags.length < 5)
    errors.push(`Need at least 5 SEO tags, got ${data.seo_tags?.length || 0}`);
  const badFilters = (data.sustainability_filters || []).filter(f => !SUSTAINABILITY_FILTERS.includes(f));
  if (badFilters.length)
    errors.push(`Unknown sustainability filters: ${badFilters.join(", ")}`);
  if (typeof data.confidence_score !== "number" || data.confidence_score < 0 || data.confidence_score > 1)
    errors.push("confidence_score must be 0.0–1.0");
  return errors;
}

// ── Main Module Function ──
async function classifyProduct({ name, description }) {
  // 1. Build prompt (business logic)
  const prompt = buildPrompt(name, description);

  // 2. Call AI (isolated service)
  const aiResult = await GeminiService.call(prompt, "MODULE_1_CATALOG");
  if (!aiResult.success) {
    return { success: false, error: aiResult.error };
  }

  // 3. Validate AI output (business rules)
  const validationErrors = validate(aiResult.data);
  const isLowConfidence = aiResult.data.confidence_score < 0.65;

  // 4. Build database record (business logic)
  const record = {
    id: `PRD-${uuidv4().slice(0, 8).toUpperCase()}`,
    name,
    description,
    primary_category: aiResult.data.primary_category,
    sub_category: aiResult.data.sub_category,
    seo_tags: aiResult.data.seo_tags,
    sustainability_filters: aiResult.data.sustainability_filters,
    confidence_score: aiResult.data.confidence_score,
    reasoning: aiResult.data.reasoning,
    needs_review: validationErrors.length > 0 || isLowConfidence,
    validation_errors: validationErrors,
    created_at: new Date().toISOString(),
  };

  // 5. Persist (database layer)
  Database.saveProduct(record);

  if (validationErrors.length > 0) {
    Logger.aiCall({
      module: "MODULE_1_VALIDATION",
      prompt: `Validating: ${name}`,
      response: validationErrors,
      status: "WARN",
      durationMs: 0,
    });
  }

  return { success: true, data: record, warnings: validationErrors };
}

module.exports = { classifyProduct, CATEGORIES, SUSTAINABILITY_FILTERS };
