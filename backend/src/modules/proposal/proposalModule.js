// src/modules/proposal/proposalModule.js
// ─────────────────────────────────────────
//  Module 2: B2B Proposal Generator
//  Pricing & impact logic is pure JS — not AI
// ─────────────────────────────────────────
const { v4: uuidv4 } = require("uuid");
const GeminiService = require("../../services/geminiService");
const Database = require("../../services/database");
const Logger = require("../../utils/logger");

// ── Business Constants ──
const PRICING_TIERS = {
  starter:    { label: "Starter",    minQty: 1,    maxQty: 499,  discountPct: 0,  color: "#64748b" },
  growth:     { label: "Growth",     minQty: 500,  maxQty: 4999, discountPct: 8,  color: "#0ea5e9" },
  enterprise: { label: "Enterprise", minQty: 5000, maxQty: null, discountPct: 15, color: "#10b981" },
};

const IMPACT_PER_UNIT = {
  co2SavedKg:      0.45,
  plasticAvoidedG: 120,
  treesSaved:      0.003,
};

const COST_RATES = {
  packaging: 0.05,  // 5% of product cost
  logistics: 0.03,  // 3% of product cost
};

// ── Pure Business Functions ──
function getPricingTier(qty) {
  if (qty >= 5000) return PRICING_TIERS.enterprise;
  if (qty >= 500)  return PRICING_TIERS.growth;
  return PRICING_TIERS.starter;
}

function computeImpact(qty) {
  return {
    co2_saved_kg:       parseFloat((qty * IMPACT_PER_UNIT.co2SavedKg).toFixed(2)),
    plastic_avoided_kg: parseFloat(((qty * IMPACT_PER_UNIT.plasticAvoidedG) / 1000).toFixed(2)),
    trees_saved:        parseFloat((qty * IMPACT_PER_UNIT.treesSaved).toFixed(2)),
  };
}

function computeCostBreakdown(recommendedProducts, budget) {
  const productCost   = recommendedProducts.reduce((sum, p) => sum + (p.units * p.unit_price), 0);
  const packagingCost = parseFloat((productCost * COST_RATES.packaging).toFixed(2));
  const logisticsCost = parseFloat((productCost * COST_RATES.logistics).toFixed(2));
  const totalCost     = parseFloat((productCost + packagingCost + logisticsCost).toFixed(2));
  const remaining     = budget ? parseFloat((budget - totalCost).toFixed(2)) : null;

  return {
    budget:           budget || null,
    product_cost:     parseFloat(productCost.toFixed(2)),
    packaging_cost:   packagingCost,
    logistics_cost:   logisticsCost,
    total_cost:       totalCost,
    remaining_budget: remaining,
    within_budget:    budget ? totalCost <= budget : null,
  };
}

// ── Prompt Builder ──
// selectedDbProducts = [{ id, name, unit_price }] — Module 1 products with optional user price
// customProducts     = [{ name, unit_price }]     — manually typed products
function buildPrompt(clientName, industry, orderQty, budget, goals, selectedDbProducts, customProducts) {

  // Module 1 DB products
  const dbLines = selectedDbProducts.map(p =>
    p.unit_price
      ? `- ${p.name} | FIXED PRICE: ${p.unit_price} per unit | units: ${orderQty} | line total: ${p.unit_price * orderQty}`
      : `- ${p.name} (estimate a realistic unit price)`
  ).join("\n");

  // Custom typed products
  const customLines = customProducts.map(p =>
    p.unit_price
      ? `- ${p.name} | FIXED PRICE: ${p.unit_price} per unit | units: ${orderQty} | line total: ${p.unit_price * orderQty}`
      : `- ${p.name} (estimate a realistic unit price)`
  ).join("\n");

  const allProductLines = [dbLines, customLines].filter(Boolean).join("\n");
  const budgetLine      = budget
    ? `Budget Limit: ${budget} (total cost MUST stay below this)`
    : "Budget: Not specified";

  return `You are a senior B2B sustainability sales consultant writing a professional proposal.
Return ONLY valid JSON. No markdown, no explanation.

Return this exact structure:
{
  "executive_summary": "2-3 sentence compelling opening",
  "client_pain_points": ["pain1", "pain2", "pain3"],
  "recommended_products": [
    { "name": "", "reason": "", "units": 0, "unit_price": 0 }
  ],
  "sustainability_impact_headline": "one powerful stat sentence",
  "value_proposition": "2-3 sentences on ROI and brand value",
  "call_to_action": "one strong closing sentence"
}

STRICT RULES:
1. If a product has FIXED PRICE listed, use that EXACT number in unit_price
2. If a product has FIXED PRICE, use exactly the units number listed
3. Do NOT invent prices to match the budget
4. Budget is a LIMIT not a target — stay under it

Client: ${clientName}
Industry: ${industry}
Order Quantity: ${orderQty} units
${budgetLine}
Sustainability Goals: ${goals || "General sustainability improvement"}
Products Available:
${allProductLines || "- Eco Packaging Bundle (estimate a realistic unit price)\n- Recycled Office Kit (estimate a realistic unit price)"}`;
}

// ── Validator ──
function validate(data) {
  const errors = [];
  if (!data.executive_summary)
    errors.push("Missing executive_summary");
  if (!Array.isArray(data.recommended_products) || !data.recommended_products.length)
    errors.push("No recommended_products returned");
  if (!data.value_proposition)
    errors.push("Missing value_proposition");
  if (!data.call_to_action)
    errors.push("Missing call_to_action");
  if (Array.isArray(data.recommended_products)) {
    data.recommended_products.forEach((p, index) => {
      if (typeof p.units !== "number" || p.units <= 0)
        errors.push(`Invalid units for product at index ${index}`);
      if (typeof p.unit_price !== "number" || p.unit_price <= 0)
        errors.push(`Invalid unit_price for product at index ${index}`);
    });
  }
  return errors;
}

// ── Main Module Function ──
async function generateProposal({
  clientName,
  industry,
  orderQty,
  budget,
  goals,
  selectedDbProducts = [],  // [{ id, name, unit_price }] from Module 1 with user-entered prices
  customProducts     = [],  // [{ name, unit_price }] manually typed
}) {
  // 1. Business logic — pricing & impact (no AI needed)
  const qty       = parseInt(orderQty);
  const budgetNum = budget ? parseFloat(budget) : null;
  const tier      = getPricingTier(qty);
  const impact    = computeImpact(qty);

  // 2. If nothing provided at all — fallback to latest 5 from DB
  let finalDbProducts = selectedDbProducts;
  if (selectedDbProducts.length === 0 && customProducts.length === 0) {
    const latest    = await Database.getProducts();
    finalDbProducts = latest.slice(0, 5).map(p => ({ id: p.id, name: p.name, unit_price: null }));
  }

  // 3. Build fixed price map for BOTH db products and custom products
  //    key = product name lowercase, value = { price, units }
  //    Used after AI responds to force-correct any prices AI ignores
  const fixedPriceMap = new Map();

  finalDbProducts.forEach(p => {
    if (p.unit_price) {
      fixedPriceMap.set(p.name.toLowerCase(), { price: parseFloat(p.unit_price), units: qty });
    }
  });
  customProducts.forEach(p => {
    if (p.unit_price) {
      fixedPriceMap.set(p.name.toLowerCase(), { price: parseFloat(p.unit_price), units: qty });
    }
  });

  // 4. Build prompt
  const prompt = buildPrompt(
    clientName,
    industry,
    qty,
    budgetNum,
    goals,
    finalDbProducts,
    customProducts
  );

  // 5. Call AI
  const aiResult = await GeminiService.call(prompt, "MODULE_2_PROPOSAL");
  if (!aiResult.success) {
    return { success: false, error: aiResult.error };
  }

  // 6. Validate AI output
  const validationErrors = validate(aiResult.data);

 
  let correctedProducts;

if (fixedPriceMap.size > 0) {
  // Backend is authoritative when user sets prices
  correctedProducts = Array.from(fixedPriceMap.entries()).map(([name, data]) => ({
    name,
    reason: "User selected catalog product",
    units: data.units,
    unit_price: data.price
  }));
} else {
  // No fixed prices → trust AI suggestions
  correctedProducts = aiResult.data.recommended_products || [];
}

// Remove products AI added that weren't requested
if (fixedPriceMap.size > 0) {
  correctedProducts = correctedProducts.filter(p =>
    fixedPriceMap.has(p.name?.toLowerCase())
  );
}
  // 8. Compute cost breakdown from corrected products (pure JS — no AI)
  const costBreakdown = computeCostBreakdown(correctedProducts, budgetNum);

  // 9. Flag if over budget
  if (budgetNum && !costBreakdown.within_budget) {
    validationErrors.push(
      `Over budget: total cost ${costBreakdown.total_cost} exceeds budget ${budgetNum}`
    );
  }

  // 10. Build final record
  const record = {
    id:                   `PROP-${uuidv4().slice(0, 8).toUpperCase()}`,
    client_name:          clientName,
    industry,
    order_qty:            qty,
    sustainability_goals: goals,
    // Business-computed (NOT from AI)
    pricing_tier:         tier.label,
    discount_pct:         tier.discountPct,
    computed_impact:      impact,
    cost_breakdown:       costBreakdown,
    // AI-generated narrative (with corrected product prices)
    executive_summary:              aiResult.data.executive_summary,
    client_pain_points:             aiResult.data.client_pain_points,
    recommended_products:           correctedProducts,  // corrected — not raw AI
    sustainability_impact_headline: aiResult.data.sustainability_impact_headline,
    value_proposition:              aiResult.data.value_proposition,
    call_to_action:                 aiResult.data.call_to_action,
    // Meta
    needs_review:      validationErrors.length > 0,
    validation_errors: validationErrors,
    created_at:        new Date().toISOString(),
  };

  // 11. Persist to MongoDB
  await Database.saveProposal(record);

  return { success: true, data: record, warnings: validationErrors };
}

module.exports = { generateProposal, PRICING_TIERS, IMPACT_PER_UNIT, computeCostBreakdown };