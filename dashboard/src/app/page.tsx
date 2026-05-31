import { fetchTraces, fetchLogs, fetchAnomalies } from "@/lib/api";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="card"
      style={{ borderLeft: `3px solid ${accent ?? "var(--accent)"}` }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: accent ?? "var(--accent-bright)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            marginTop: "6px",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export default async function OverviewPage() {
  const [traces, logs, anomalies] = await Promise.allSettled([
    fetchTraces(200),
    fetchLogs(200),
    fetchAnomalies(),
  ]);

  const traceList = traces.status === "fulfilled" ? traces.value : [];
  const logList = logs.status === "fulfilled" ? logs.value : [];
  const anomalyList = anomalies.status === "fulfilled" ? anomalies.value : [];

  const services = [...new Set(traceList.map((t) => t.service_name))];
  const errorTraces = traceList.filter((t) => t.status_code !== 0);
  const errorRate =
    traceList.length > 0
      ? ((errorTraces.length / traceList.length) * 100).toFixed(1)
      : "0.0";

  const recentTraces = traceList.slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          System Overview
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "4px",
          }}
        >
          Real-time distributed tracing across all services
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard
          label="Total Traces"
          value={traceList.length}
          sub="last 200 spans"
          accent="var(--accent)"
        />
        <StatCard
          label="Active Services"
          value={services.length}
          sub={services.join(", ") || "none"}
          accent="var(--success)"
        />
        <StatCard
          label="Error Rate"
          value={`${errorRate}%`}
          sub={`${errorTraces.length} error spans`}
          accent={parseFloat(errorRate) > 5 ? "var(--error)" : "var(--warning)"}
        />
        <StatCard
          label="Log Events"
          value={logList.length}
          sub="last 200 entries"
          accent="var(--accent-bright)"
        />
        <StatCard
          label="Anomalies"
          value={anomalyList.length}
          sub={anomalyList.length > 0 ? "AI hypotheses generated" : "system nominal"}
          accent={anomalyList.length > 0 ? "var(--error)" : "var(--success)"}
        />
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "var(--text-primary)",
            }}
          >
            Recent Traces
          </h2>
          <a href="/traces" style={{ fontSize: "0.8rem", color: "var(--accent-bright)", textDecoration: "none" }}>
            View all &gt;
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {recentTraces.length === 0 && (
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                padding: "1rem 0",
                textAlign: "center",
              }}
            >
              No traces yet. Make sure the demo service is running.
            </div>
          )}
          {recentTraces.map((trace) => (
            <div
              key={trace.span_id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto auto",
                gap: "1rem",
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                fontSize: "0.8rem",
              }}
            >
              <span className="mono" style={{ color: "var(--accent-bright)" }}>
                {trace.trace_id.slice(0, 8)}…
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {trace.service_name}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {trace.operation_name}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {trace.duration_ms.toFixed(0)}ms
              </span>
              <span
                className={`badge ${
                  trace.status_code === 0 ? "badge-ok" : "badge-error"
                }`}
              >
                {trace.status_code === 0 ? "OK" : "ERR"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {services.length > 0 && (
        <div className="card">
          <h2
            style={{
              margin: "0 0 1rem 0",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "var(--text-primary)",
            }}
          >
            Services
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {services.map((svc) => {
              const svcTraces = traceList.filter((t) => t.service_name === svc);
              const svcErrors = svcTraces.filter((t) => t.status_code !== 0).length;
              const svcErrorRate =
                svcTraces.length > 0
                  ? ((svcErrors / svcTraces.length) * 100).toFixed(1)
                  : "0.0";
              const avgDuration =
                svcTraces.length > 0
                  ? (
                      svcTraces.reduce((s, t) => s + t.duration_ms, 0) /
                      svcTraces.length
                    ).toFixed(0)
                  : "0";

              return (
                <div
                  key={svc}
                  className="card card-hover"
                  style={{ padding: "1rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {svc}
                    </span>
                    <div className="pulse-dot" />
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <span>{svcTraces.length} spans</span>
                    <span>avg {avgDuration}ms</span>
                    <span
                      style={{
                        color:
                          parseFloat(svcErrorRate) > 5
                            ? "var(--error)"
                            : "var(--success)",
                      }}
                    >
                      {svcErrorRate}% errors
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
