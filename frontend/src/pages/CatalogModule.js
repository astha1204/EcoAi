// src/pages/CatalogModule.js
import { useState } from "react";
import { API } from "../services/api";

const SAMPLES = [
  { name: "Bamboo Kraft Paper Bag", description: "100% bamboo-based kraft paper bag for retail packaging. No plastic lining, fully compostable within 90 days. Suitable for B2B bulk orders." },
  { name: "Recycled PET Desk Organizer", description: "Office desk organizer made from post-consumer recycled PET bottles. BPA-free, modular stackable design for corporate offices." },
  { name: "Sugarcane Bagasse Plates", description: "Disposable plates made from sugarcane bagasse agricultural waste. Compostable in industrial facilities, suitable for food service." },
];

export default function CatalogModule({ onProductAdded }) {
  const [form, setForm]       = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit() {
    setLoading(true); setResult(null); setError("");
    try {
      const res = await API.classifyProduct(form);
      setResult(res.data);
      if (onProductAdded) onProductAdded(res.data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="module-grid">
      {/* Input Card */}
      <div className="card">
        <div className="card-title">⬡ Module 1 — AI Catalog Classifier</div>

        <div className="sample-row">
          <span className="label">Quick Samples:</span>
          {SAMPLES.map((s, i) => (
            <button key={i} className="btn-ghost" onClick={() => setForm(s)}>Sample {i+1}</button>
          ))}
        </div>

        <label className="label">Product Name</label>
        <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Bamboo Kraft Paper Bag" />

        <label className="label">Product Description (min 20 chars)</label>
        <textarea className="textarea" rows={5} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe materials, use-case, sustainability features..." />

        <button className={`btn-primary ${loading ? "loading" : ""}`} onClick={handleSubmit} disabled={loading || !form.name || form.description.length < 20}>
          {loading ? "⟳  Classifying..." : "→  Run AI Classification"}
        </button>

        {error && <div className="error-box">⚠ {error}</div>}
      </div>

      {/* Result Card */}
      {result && (
        <div className="card result-card">
          <div className="result-header">
            <div>
              <div className="result-id">{result.id}</div>
              <div className="result-name">{result.name}</div>
            </div>
            <div className={`confidence ${result.confidence_score >= 0.8 ? "high" : result.confidence_score >= 0.6 ? "mid" : "low"}`}>
              {Math.round(result.confidence_score * 100)}%
              <div className="conf-label">CONFIDENCE</div>
            </div>
          </div>

          {result.needs_review && <div className="warning-box">⚠ Flagged for manual review</div>}

          <div className="section-label">Category</div>
          <span className="tag cat">{result.primary_category}</span>
          <span className="tag sub">{result.sub_category}</span>

          <div className="section-label">SEO Tags</div>
          <div>{result.seo_tags?.map((t,i) => <span key={i} className="tag seo">#{t}</span>)}</div>

          <div className="section-label">Sustainability Filters</div>
          <div>{result.sustainability_filters?.map((f,i) => <span key={i} className="tag eco">✓ {f}</span>)}</div>

          <div className="section-label">AI Reasoning</div>
          <p className="reasoning">{result.reasoning}</p>

          <div className="section-label">JSON Record (stored in DB)</div>
          <pre className="json-block">{JSON.stringify({
            id: result.id,
            primary_category: result.primary_category,
            sub_category: result.sub_category,
            seo_tags: result.seo_tags,
            sustainability_filters: result.sustainability_filters,
            confidence_score: result.confidence_score,
            needs_review: result.needs_review,
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
