"use client";

import { useState, useEffect } from "react";
import { fetchAnomalies, fetchMetrics, Anomaly, Metric } from "@/lib/api";
import AnomalyCard from "@/components/AnomalyCard";
import RootCausePanel from "@/components/RootCausePanel";
import MetricsChart from "@/components/MetricsChart";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchAnomalies().catch(() => []);
      setAnomalies(data);
      if (data.length > 0) setSelected(data[0]);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMetrics(selected.service_name, "error_rate", 60)
      .then(setMetrics)
      .catch(() => setMetrics([]));
  }, [selected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            Anomalies
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            AI-powered root cause analysis. Anomalies trigger automatically when error rate spikes.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="pulse-dot" style={{ background: anomalies.length > 0 ? "var(--error)" : "var(--success)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {loading ? "Loading..." : `${anomalies.length} anomalies`}
          </span>
        </div>
      </div>

      {!loading && anomalies.length === 0 && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "3rem", borderLeft: "3px solid var(--success)" }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
          <div style={{ fontWeight: "600", color: "var(--success)", marginBottom: "4px" }}>
            System Nominal
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            No anomalies detected. To trigger one, run the spike test or wait for the
            auto-spike timer in the demo service.
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1rem",
              background: "var(--bg-secondary)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              display: "inline-block",
            }}
          >
            Manual spike:{" "}
            <span className="mono" style={{ color: "var(--accent-bright)" }}>
              GET http://localhost:8080/spike/auth-service
            </span>
          </div>
        </div>
      )}

      {anomalies.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Anomaly list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
              Detected Anomalies
            </div>
            {anomalies.map((a, i) => (
              <AnomalyCard
                key={i}
                anomaly={a}
                isSelected={selected === a}
                onClick={() => setSelected(a)}
              />
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Metrics chart */}
              {metrics.length > 0 && (
                <div className="card">
                  <div style={{ fontWeight: "600", fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
                    Error Rate Timeline
                  </div>
                  <MetricsChart
                    metrics={metrics}
                    serviceName={selected.service_name}
                    metricName="error_rate"
                    height={140}
                  />
                </div>
              )}

              {/* Root cause panel */}
              <div className="card glow-red">
                <RootCausePanel anomaly={selected} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}