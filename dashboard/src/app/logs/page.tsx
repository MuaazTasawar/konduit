import { fetchLogs } from "@/lib/api";
import LogTable from "@/components/LogTable";

export default async function LogsPage() {
  const logs = await fetchLogs(200).catch(() => []);

  const errorCount = logs.filter(
    (l) => l.severity.toUpperCase() === "ERROR"
  ).length;

  const services = [...new Set(logs.map((l) => l.service_name))];

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
          Logs
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Structured log stream across all services. Filter by severity or search by message.
        </p>
      </div>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            Total Logs
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--accent-bright)" }}>
            {logs.length}
          </div>
        </div>
        <div className="card" style={{ borderLeft: "3px solid var(--error)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            Errors
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--error)" }}>
            {errorCount}
          </div>
        </div>
        <div className="card" style={{ borderLeft: "3px solid var(--success)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            Services
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--success)" }}>
            {services.length}
          </div>
        </div>
      </div>

      {/* Log table */}
      <div className="card">
        <LogTable logs={logs} />
      </div>
    </div>
  );
}