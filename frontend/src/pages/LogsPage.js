// src/pages/LogsPage.js
import { useState, useEffect } from "react";
import { API } from "../services/api";

export default function LogsPage() {
  const [logs, setLogs]   = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [l, s] = await Promise.all([API.getLogs(30), API.getStats()]);
        setLogs(l.data || []);
        setStats(s.data);
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="card"><p style={{color:"#64748b"}}>Loading logs...</p></div>;

  return (
    <div>
      {stats && (
        <div className="stats-row">
          {[
            { val: stats.total_products,  label: "Products Classified" },
            { val: stats.total_proposals, label: "Proposals Generated" },
            { val: stats.needs_review,    label: "Needs Review" },
            { val: stats.categories?.length || 0, label: "Categories Used" },
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <div className="stat-num">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">⬡ AI Call Logs (auto-refreshes every 5s)</div>
        {logs.length === 0
          ? <p style={{ color: "#475569", fontSize: 12 }}>No logs yet. Run a module first.</p>
          : logs.map(log => (
            <div key={log.id} className={`log-entry status-${log.status?.toLowerCase()}`}>
              <div className="log-header">
                <span className="log-module">{log.module}</span>
                <span className={`log-status ${log.status?.toLowerCase()}`}>{log.status}</span>
                <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()} · {log.durationMs}ms</span>
              </div>
              <div className="log-prompt">PROMPT: {log.prompt_preview}</div>
              <div className="log-response">RESPONSE: {log.response_preview}</div>
              {log.error && <div className="log-error">ERROR: {log.error}</div>}
            </div>
          ))
        }
      </div>
    </div>
  );
}
