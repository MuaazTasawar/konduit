"use client";

import { Trace } from "@/lib/api";

interface Props {
  spans: Trace[];
}

export default function TraceWaterfall({ spans }: Props) {
  if (spans.length === 0) {
    return (
      <div
        style={{
          color: "var(--text-muted)",
          textAlign: "center",
          padding: "2rem",
          fontSize: "0.85rem",
        }}
      >
        No spans found for this trace.
      </div>
    );
  }

  // Calculate timeline boundaries
  const startTimes = spans.map((s) => new Date(s.start_time).getTime());
  const endTimes = spans.map((s) => new Date(s.end_time).getTime());
  const minTime = Math.min(...startTimes);
  const maxTime = Math.max(...endTimes);
  const totalDuration = maxTime - minTime || 1;

  // Sort by start time
  const sorted = [...spans].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const serviceColors: Record<string, string> = {
    "auth-service": "#3b82f6",
    "payment-service": "#10b981",
    "user-service": "#f59e0b",
    "api-gateway": "#8b5cf6",
  };

  function getColor(serviceName: string): string {
    return serviceColors[serviceName] ?? "#64748b";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {/* Timeline header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: "1rem",
          marginBottom: "8px",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          Span
        </span>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            0ms
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {totalDuration.toFixed(0)}ms
          </span>
        </div>
      </div>

      {/* Spans */}
      {sorted.map((span) => {
        const spanStart = new Date(span.start_time).getTime();
        const spanEnd = new Date(span.end_time).getTime();
        const offsetPct = ((spanStart - minTime) / totalDuration) * 100;
        const widthPct = Math.max(
          ((spanEnd - spanStart) / totalDuration) * 100,
          0.5
        );
        const color = getColor(span.service_name);
        const isError = span.status_code !== 0;

        return (
          <div
            key={span.span_id}
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            {/* Span info */}
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: isError ? "var(--error)" : "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {span.operation_name}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                {span.service_name} · {span.duration_ms.toFixed(0)}ms
              </div>
            </div>

            {/* Waterfall bar */}
            <div
              style={{
                position: "relative",
                height: "24px",
                background: "var(--bg-secondary)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${offsetPct}%`,
                  width: `${widthPct}%`,
                  height: "100%",
                  background: isError
                    ? "var(--error)"
                    : color,
                  opacity: isError ? 0.9 : 0.75,
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "6px",
                  minWidth: "2px",
                }}
              >
                {widthPct > 8 && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "white",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {span.duration_ms.toFixed(0)}ms
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        {Object.entries(serviceColors).map(([svc, color]) => (
          <div
            key={svc}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "2px",
                background: color,
              }}
            />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {svc}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: "var(--error)",
            }}
          />
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            error
          </span>
        </div>
      </div>
    </div>
  );
}