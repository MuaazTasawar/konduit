"use client";

import { Metric } from "@/lib/api";

interface Props {
  metrics: Metric[];
  serviceName: string;
  metricName?: string;
  height?: number;
}

export default function MetricsChart({
  metrics,
  serviceName,
  metricName = "error_rate",
  height = 120,
}: Props) {
  if (metrics.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          background: "var(--bg-secondary)",
          borderRadius: "6px",
        }}
      >
        No metric data yet
      </div>
    );
  }

  const sorted = [...metrics].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const values = sorted.map((m) => m.value);
  const max = Math.max(...values, 0.01);
  const min = Math.min(...values);
  const range = max - min || 0.01;

  const width = 600;
  const padL = 40;
  const padR = 10;
  const padT = 10;
  const padB = 20;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const points = sorted.map((m, i) => {
    const x = padL + (i / Math.max(sorted.length - 1, 1)) * chartW;
    const y = padT + chartH - ((m.value - min) / range) * chartH;
    return { x, y, m };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)}` +
    ` L ${padL} ${(padT + chartH).toFixed(1)} Z`;

  // Detect if latest value is anomalous (> 0.3 error rate)
  const latest = values[values.length - 1];
  const isAnomalous = metricName === "error_rate" && latest > 0.3;
  const lineColor = isAnomalous ? "var(--error)" : "var(--accent)";
  const areaColor = isAnomalous ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {serviceName} — {metricName}
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            color: isAnomalous ? "var(--error)" : "var(--accent-bright)",
          }}
        >
          latest: {(latest * 100).toFixed(1)}%
          {isAnomalous && " ⚠"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height, display: "block" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padT + frac * chartH;
          const val = max - frac * range;
          return (
            <g key={frac}>
              <line
                x1={padL} y1={y} x2={padL + chartW} y2={y}
                stroke="var(--border)" strokeWidth="0.5"
              />
              <text
                x={padL - 4} y={y + 4}
                fontSize="9" fill="var(--text-muted)"
                textAnchor="end"
              >
                {(val * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={areaColor} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Latest point dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={lineColor}
          />
        )}
      </svg>
    </div>
  );
}