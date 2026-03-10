// src/services/api.js
// All backend calls isolated here — never fetch() directly in components
const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const API = {
  // Module 1
  classifyProduct: (body) => request("/catalog/classify", { method: "POST", body: JSON.stringify(body) }),
  getProducts: ()  => request("/catalog/products"),
  getCatalogMeta: () => request("/catalog/meta"),

  // Module 2
  generateProposal: (body) => request("/proposals/generate", { method: "POST", body: JSON.stringify(body) }),
  getProposals: () => request("/proposals"),

  // System
  getLogs:  (limit = 30) => request(`/logs?limit=${limit}`),
  getStats: () => request("/stats"),
  health:   () => request("/health"),
};
