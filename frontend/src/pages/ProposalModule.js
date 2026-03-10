// src/pages/ProposalModule.js
import { useState, useEffect } from "react";
import { API } from "../services/api";

const TIER_COLORS = { Starter: "#64748b", Growth: "#0ea5e9", Enterprise: "#10b981" };

function getTier(qty) {
  if (qty >= 5000) return { label: "Enterprise", discount: 15 };
  if (qty >= 500)  return { label: "Growth",     discount: 8  };
  return { label: "Starter", discount: 0 };
}

export default function ProposalModule({ catalogProducts }) {
  const [form, setForm]               = useState({ clientName: "", industry: "", orderQty: "", budget: "", goals: "" });
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState("");
  const [dbProducts, setDbProducts]   = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  // dbPrices stores { [productId]: unit_price } for Module 1 products
  const [dbPrices, setDbPrices]       = useState({});
  const [customProduct, setCustomProduct]   = useState({ name: "", unit_price: "" });
  const [customProducts, setCustomProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const tier = form.orderQty ? getTier(parseInt(form.orderQty)) : null;

  // Load products from MongoDB on mount
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const res = await API.getProducts();
        setDbProducts(res.data || []);
      } catch(e) {
        console.error("Could not load products", e);
      }
      setLoadingProducts(false);
    }
    loadProducts();
  }, []);

  // Toggle DB product selection
  function toggleProduct(id) {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        // deselect — remove its price too
        setDbPrices(p => { const n = { ...p }; delete n[id]; return n; });
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  }

  // Update price for a selected Module 1 product
  function setDbProductPrice(id, price) {
    setDbPrices(prev => ({ ...prev, [id]: price }));
  }

  // Add custom product
  function addCustomProduct() {
    const name = customProduct.name.trim();
    if (!name) return;
    if (customProducts.find(p => p.name === name)) return;
    setCustomProducts(prev => [...prev, {
      name,
      unit_price: customProduct.unit_price ? parseFloat(customProduct.unit_price) : null,
    }]);
    setCustomProduct({ name: "", unit_price: "" });
  }

  function removeCustomProduct(index) {
    setCustomProducts(prev => prev.filter((_, i) => i !== index));
  }

  // Build selected DB products array with prices for payload
  const selectedDbProducts = dbProducts
    .filter(p => selectedIds.includes(p.id))
    .map(p => ({
      id:         p.id,
      name:       p.name,
      unit_price: dbPrices[p.id] ? parseFloat(dbPrices[p.id]) : null,
    }));

  const allSelectedNames = [
    ...selectedDbProducts.map(p => p.name),
    ...customProducts.map(p => p.name),
  ];

  async function handleSubmit() {
    setLoading(true); setResult(null); setError("");
    try {
      const payload = {
        clientName:        form.clientName,
        industry:          form.industry,
        orderQty:          parseInt(form.orderQty),
        budget:            form.budget ? parseFloat(form.budget) : undefined,
        goals:             form.goals,
        selectedDbProducts,  // [{ id, name, unit_price }]
        customProducts,      // [{ name, unit_price }]
      };
      const res = await API.generateProposal(payload);
      setResult(res.data);
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  }

  const cb = result?.cost_breakdown;

  return (
    <div className="module-grid">
      {/* ── Input Card ── */}
      <div className="card">
        <div className="card-title">⬡ Module 2 — B2B Proposal Generator</div>

        <div className="two-col">
          <div>
            <label className="label">Client / Company Name</label>
            <input className="input" value={form.clientName} onChange={e => set("clientName", e.target.value)} placeholder="e.g. GreenMart Retail Ltd." />
          </div>
          <div>
            <label className="label">Industry</label>
            <input className="input" value={form.industry} onChange={e => set("industry", e.target.value)} placeholder="e.g. Retail, FMCG" />
          </div>
        </div>

        <div className="two-col">
          <div>
            <label className="label">Order Quantity (units)</label>
            <input className="input" type="number" value={form.orderQty} onChange={e => set("orderQty", e.target.value)} placeholder="e.g. 2000" />
          </div>
          <div>
            <label className="label">Budget (optional)</label>
            <input className="input" type="number" value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="e.g. 50000" />
          </div>
        </div>

        {tier && (
          <div className="tier-badge" style={{ borderColor: TIER_COLORS[tier.label] + "44" }}>
            <span style={{ color: TIER_COLORS[tier.label] }}>⬡ {tier.label} Tier</span>
            <span className="tier-discount">{tier.discount > 0 ? `${tier.discount}% volume discount` : "Standard pricing"}</span>
          </div>
        )}

        <label className="label">Sustainability Goals</label>
        <textarea className="textarea" rows={3} value={form.goals} onChange={e => set("goals", e.target.value)} placeholder="e.g. Eliminate single-use plastic by Q3 2025..." />

        {/* ── Module 1 Products with Price Input ── */}
        <div className="section-label" style={{ marginTop: 8 }}>
          Select Products from Module 1 Catalog
        </div>
        <div style={{ fontSize: 10, color: "#475569", marginBottom: 8 }}>
          💡 Enter unit price after selecting — leave blank and AI will estimate
        </div>

        {loadingProducts ? (
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>⟳ Loading catalog...</div>
        ) : dbProducts.length === 0 ? (
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 12, padding: "8px 12px", background: "#0f172a", borderRadius: 6 }}>
            No products in catalog yet — classify some in Module 1 first, or add custom products below.
          </div>
        ) : (
          <div className="product-select-list">
            {dbProducts.map(p => (
              <div key={p.id} style={{ borderBottom: "1px solid #0f172a" }}>
                {/* Checkbox row */}
                <div
                  className={`product-select-item ${selectedIds.includes(p.id) ? "selected" : ""}`}
                  style={{ borderBottom: "none" }}
                  onClick={() => toggleProduct(p.id)}
                >
                  <div className="product-select-check">
                    {selectedIds.includes(p.id) ? "✓" : "○"}
                  </div>
                  <div className="product-select-info">
                    <div className="product-select-name">{p.name}</div>
                    <div className="product-select-meta">{p.primary_category} · {p.sub_category}</div>
                  </div>
                </div>
                {/* Price input — only visible when selected */}
                {selectedIds.includes(p.id) && (
                  <div style={{ padding: "0 14px 10px 42px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Unit Price:</span>
                    <input
                      type="number"
                      className="input"
                      style={{ marginBottom: 0, width: 120, padding: "4px 10px", fontSize: 12 }}
                      placeholder="e.g. 150"
                      value={dbPrices[p.id] || ""}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setDbProductPrice(p.id, e.target.value)}
                    />
                    {dbPrices[p.id]
                      ? <span style={{ fontSize: 10, color: "#4ade80" }}>✓ Fixed price set</span>
                      : <span style={{ fontSize: 10, color: "#475569" }}>AI will estimate if blank</span>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Custom Products ── */}
        <div className="section-label">Add Custom Products</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            style={{ marginBottom: 0, flex: 2 }}
            value={customProduct.name}
            onChange={e => setCustomProduct(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addCustomProduct()}
            placeholder="Product name"
          />
          <input
            className="input"
            style={{ marginBottom: 0, flex: 1 }}
            type="number"
            value={customProduct.unit_price}
            onChange={e => setCustomProduct(p => ({ ...p, unit_price: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addCustomProduct()}
            placeholder="Unit price"
          />
          <button onClick={addCustomProduct} style={{
            background: "#0f172a", border: "1px solid #1e3a5f", color: "#0ea5e9",
            padding: "0 16px", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap",
          }}>+ Add</button>
        </div>
        <div style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>
          💡 Unit price optional — leave blank and AI will estimate
        </div>

        {customProducts.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {customProducts.map((p, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#0c1a2e", border: "1px solid #1e3a5f",
                color: "#7dd3fc", fontSize: 11, padding: "3px 10px",
                borderRadius: 99, margin: "3px 4px",
              }}>
                {p.name} {p.unit_price ? `@ ₹${p.unit_price}` : "(AI will price)"}
                <span onClick={() => removeCustomProduct(i)}
                  style={{ cursor: "pointer", color: "#475569", fontWeight: 700 }}>×</span>
              </span>
            ))}
          </div>
        )}

        {allSelectedNames.length > 0 && (
          <div className="info-box" style={{ marginBottom: 12 }}>
            ✓ {allSelectedNames.length} product(s) selected: {allSelectedNames.join(", ")}
          </div>
        )}

        {allSelectedNames.length === 0 && (
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 12, fontStyle: "italic" }}>
            ℹ Nothing selected — will auto-use latest 5 products from catalog
          </div>
        )}

        <button
          className={`btn-primary ${loading ? "loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading || !form.clientName || !form.industry || !form.orderQty}
        >
          {loading ? "⟳  Generating Proposal..." : "→  Generate B2B Proposal"}
        </button>

        {error && <div className="error-box">⚠ {error}</div>}
      </div>

      {/* ── Result Card ── */}
      {result && (
        <div className="card result-card">
          <div className="result-header">
            <div>
              <div className="result-id">{result.id}</div>
              <div className="result-name">Proposal for {result.client_name}</div>
              <div className="result-sub">{result.industry} · {result.order_qty?.toLocaleString()} units · {result.pricing_tier} Tier</div>
            </div>
            {result.discount_pct > 0 && (
              <div className="discount-badge">
                <div className="discount-num">{result.discount_pct}%</div>
                <div className="conf-label">DISCOUNT</div>
              </div>
            )}
          </div>

          {cb && (
            <>
              <div className="section-label">Budget & Cost Breakdown</div>
              <div className="cost-grid">
                {[
                  { label: "Product Cost",   val: cb.product_cost },
                  { label: "Packaging (5%)", val: cb.packaging_cost },
                  { label: "Logistics (3%)", val: cb.logistics_cost },
                  { label: "Total Cost",     val: cb.total_cost, bold: true },
                ].map((row, i) => (
                  <div key={i} className="cost-row">
                    <span className="cost-label">{row.label}</span>
                    <span className={`cost-val ${row.bold ? "bold" : ""}`}>{row.val?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {cb.budget && (
                <div className={`budget-status ${cb.within_budget ? "ok" : "over"}`}>
                  {cb.within_budget
                    ? `✓ Within budget — ${cb.remaining_budget?.toLocaleString()} remaining of ${cb.budget?.toLocaleString()} budget`
                    : `⚠ Over budget by ${Math.abs(cb.remaining_budget)?.toLocaleString()}`}
                </div>
              )}
            </>
          )}

          <div className="section-label">Executive Summary</div>
          <blockquote className="exec-summary">{result.executive_summary}</blockquote>

          <div className="section-label">Client Pain Points</div>
          {result.client_pain_points?.map((p, i) => <div key={i} className="pain-item">▸ {p}</div>)}

          <div className="section-label">Recommended Products</div>
          {result.recommended_products?.map((p, i) => (
            <div key={i} className="product-rec">
              <div className="product-rec-header">
                <span className="product-rec-name">{p.name}</span>
                <span className="product-rec-price">
                  {p.units?.toLocaleString()} units @ {p.unit_price} = {(p.units * p.unit_price)?.toLocaleString()}
                </span>
              </div>
              <div className="product-rec-reason">{p.reason}</div>
            </div>
          ))}

          <div className="section-label">Sustainability Impact</div>
          <div className="impact-grid">
            {[
              { val: result.computed_impact?.co2_saved_kg + " kg",       label: "CO₂ Saved" },
              { val: result.computed_impact?.plastic_avoided_kg + " kg", label: "Plastic Avoided" },
              { val: result.computed_impact?.trees_saved,                 label: "Trees Saved" },
            ].map((s, i) => (
              <div key={i} className="impact-stat">
                <div className="impact-num">{s.val}</div>
                <div className="impact-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="impact-headline">✦ {result.sustainability_impact_headline}</div>

          <div className="section-label">Value Proposition</div>
          <p className="reasoning">{result.value_proposition}</p>

          <div className="section-label">Call to Action</div>
          <div className="cta-box">→ {result.call_to_action}</div>

          <div className="section-label">JSON Record</div>
          <pre className="json-block">{JSON.stringify({
            id: result.id,
            client_name: result.client_name,
            pricing_tier: result.pricing_tier,
            discount_pct: result.discount_pct,
            cost_breakdown: result.cost_breakdown,
            computed_impact: result.computed_impact,
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}