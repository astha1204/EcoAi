// src/App.js
import { useState } from "react";
import CatalogModule  from "./pages/CatalogModule";
import ProposalModule from "./pages/ProposalModule";
import LogsPage       from "./pages/LogsPage";
import "./App.css";

const TABS = [
  { key: "catalog",  label: "Module 1 · Catalog AI",   icon: "⬡" },
  { key: "proposal", label: "Module 2 · Proposal AI",  icon: "⬡" },
  { key: "logs",     label: "Logs & Stats",             icon: "⬡" },
];

export default function App() {
  const [tab, setTab] = useState("catalog");
  const [catalogProducts, setCatalogProducts] = useState([]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🌿</div>
            <div>
              <div className="logo-name">EcoAI Catalog System</div>
              <div className="logo-sub">B2B Sustainability Platform · Gemini Powered</div>
            </div>
          </div>
          <span className="badge">Module 1 + 2 Live</span>
        </div>
      </header>

      <main className="main">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "catalog"  && <CatalogModule  onProductAdded={p => setCatalogProducts(prev => [...prev, p])} />}
        {tab === "proposal" && <ProposalModule catalogProducts={catalogProducts} />}
        {tab === "logs"     && <LogsPage />}
      </main>
    </div>
  );
}
