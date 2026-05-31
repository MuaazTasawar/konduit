"use client";

import { Anomaly } from "@/lib/api";

interface Props {
  anomaly: Anomaly;
  isSelected: boolean;
  onClick: () => void;
}

export default function AnomalyCard({ anomaly, isSelected, onClick }: Props) {
  const zScoreLabel =
    anomaly.z_score > 5
      ? "CRITICAL"
      : anomaly.z_score > 3
      ? "HIGH"
      : "ELEVATED";

  const zColor =
    anomaly.z_score > 5
      ? "var(--error)"
      : anomaly.z_score > 3
      ? "var(--warning)"
      : "var(--accent-bright)";

  return (
    <div
      onClick={onClick}
      className="card card-hover"
      style={{
        cursor: "pointer",
        borderLeft: `3px solid ${isSelected ? "var(--accent)" : "var(--error)"}`,
        background: isSelected ? "var(--accent-glow)" : "var(--bg-card)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
        <div>
          <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--text-primary)" }}>
            {anomaly.service_name}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
            {anomaly.metric_name} spike
          </div>
        </div>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: "700",
            color: zColor,
            background: `${zColor}22`,
            border: `1px solid ${zColor}44`,
            padding: "2px 6px",
            borderRadius: "4px",
            letterSpacing: "0.05em",
          }}
        >
          {zScoreLabel}
        </span>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Value
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--error)" }}>
            {(anomaly.current_value * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Z-Score
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: zColor }}>
            {anomaly.z_score.toFixed(2)}σ
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Detected
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {new Date(anomaly.detected_at).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          fontStyle: "italic",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {anomaly.hypothesis
          ? `"${anomaly.hypothesis.slice(0, 120)}..."`
          : "Click to view AI hypothesis"}
      </div>
    </div>
  );
}