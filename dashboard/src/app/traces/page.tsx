import { fetchTraces, fetchTraceByID } from "@/lib/api";
import TraceWaterfall from "@/components/TraceWaterfall";

export default async function TracesPage({
  searchParams,
}: {
  searchParams: Promise<{ trace_id?: string }>;
}) {
  const traces = await fetchTraces(100).catch(() => []);
  const params = await searchParams;
  const selectedTraceID = params?.trace_id ?? null;
  const selectedSpans = selectedTraceID
    ? await fetchTraceByID(selectedTraceID).catch(() => [])
    : [];

  const uniqueTraces = Object.values(
    traces.reduce(
      (acc, trace) => {
        if (!acc[trace.trace_id]) acc[trace.trace_id] = trace;
        return acc;
      },
      {} as Record<string, (typeof traces)[0]>
    )
  ).slice(0, 50);

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
          Traces
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Distributed traces across all services. Click a trace to view its waterfall.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedTraceID ? "1fr 1fr" : "1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
              Recent Traces
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                background: "var(--bg-secondary)",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              {uniqueTraces.length} traces
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 60px 50px",
              gap: "0.5rem",
              padding: "8px 1.25rem",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>Trace ID</span>
            <span>Service</span>
            <span>Operation</span>
            <span>Duration</span>
            <span>Status</span>
          </div>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {uniqueTraces.map((trace) => {
              const isSelected = trace.trace_id === selectedTraceID;
              return (
                <a key={trace.trace_id} href={`/traces?trace_id=${trace.trace_id}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 60px 50px", gap: "0.5rem", padding: "10px 1.25rem", borderBottom: "1px solid var(--border)", textDecoration: "none", background: isSelected ? "var(--accent-glow)" : "transparent", borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent", transition: "background 0.15s", alignItems: "center" }}>
                  <span className="mono" style={{ color: "var(--accent-bright)", fontSize: "0.75rem" }}>
                    {trace.trace_id.slice(0, 8)}…
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {trace.service_name}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {trace.operation_name}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {trace.duration_ms.toFixed(0)}ms
                  </span>
                  <span className={`badge ${trace.status_code === 0 ? "badge-ok" : "badge-error"}`}>
                    {trace.status_code === 0 ? "OK" : "ERR"}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {selectedTraceID && (
          <div className="card">
            <div
              style={{
                marginBottom: "1rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "4px" }}>
                Trace Waterfall
              </div>
              <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                {selectedTraceID}
              </div>
            </div>
            <TraceWaterfall spans={selectedSpans} />
          </div>
        )}
      </div>
    </div>
  );
}
