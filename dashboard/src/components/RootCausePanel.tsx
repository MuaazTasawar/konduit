"use client";

import { Anomaly } from "@/lib/api";

interface Props {
  anomaly: Anomaly;
}

export default function RootCausePanel({ anomaly }: Props) {
  const zScoreLabel =
    anomaly.z_score > 5 ? "CRITICAL" : anomaly.z_score > 3 ? "HIGH" : "ELEVATED";

  const zColor =
    anomaly.z_score > 5
      ? "var(--error)"
      : anomaly.z_score > 3
      ? "var(--warning)"
      : "var(--accent-bright)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div
        style={{
          padding: "1rem",
          background: "var(--error-glow)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--error)" }}>
            Anomaly Detected
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: "700",
              color: zColor,
              background: `${zColor}22`,
              border: `1px solid ${zColor}55`,
              padding: "2px 8px",
              borderRadius: "4px",
              letterSpacing: "0.08em",
            }}
          >
            {zScoreLabel}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Service
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" }}>
              {anomaly.service_name}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Error Rate
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--error)" }}>
              {(anomaly.current_value * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Z-Score
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: "700", color: zColor }}>
              {anomaly.z_score.toFixed(2)}σ
            </div>
          </div>
        </div>
      </div>

      {/* AI Root Cause */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "var(--accent)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "white",
              fontWeight: "700",
              flexShrink: 0,
            }}
          >
            AI
          </div>
          <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--text-primary)" }}>
            Root Cause Hypothesis
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              background: "var(--bg-secondary)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            Gemini 2.0 Flash
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--accent)",
            borderRadius: "6px",
            padding: "1rem",
            fontSize: "0.85rem",
            color: "var(--text-primary)",
            lineHeight: "1.7",
            fontStyle: "italic",
          }}
        >
          {anomaly.hypothesis || "No hypothesis generated. Ensure GEMINI_API_KEY is set and quota is available."}
        </div>
      </div>

      {/* Metadata */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        <div
          className="card"
          style={{ padding: "0.75rem" }}
        >
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Metric
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {anomaly.metric_name}
          </div>
        </div>
        <div className="card" style={{ padding: "0.75rem" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Detected At
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {new Date(anomaly.detected_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Advice */}
      <div
        style={{
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "6px",
          padding: "0.75rem",
          fontSize: "0.78rem",
          color: "var(--text-secondary)",
        }}
      >
        <strong style={{ color: "var(--accent-bright)" }}>Next steps:</strong> Check service logs
        for {anomaly.service_name} around{" "}
        {new Date(anomaly.detected_at).toLocaleTimeString()}. Correlate with upstream
        dependencies and recent deployments. Verify connection pool limits and retry
        budgets.
      </div>
    </div>
  );
}