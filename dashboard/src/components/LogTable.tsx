"use client";

import { Log } from "@/lib/api";
import { useState } from "react";

interface Props {
  logs: Log[];
}

const severityOrder = ["ERROR", "WARN", "WARNING", "INFO", "DEBUG"];

function SeverityBadge({ severity }: { severity: string }) {
  const upper = severity.toUpperCase();
  let cls = "badge-info";
  if (upper === "ERROR") cls = "badge-error";
  else if (upper === "WARN" || upper === "WARNING") cls = "badge-warn";
  else if (upper === "DEBUG") cls = "badge";
  return <span className={`badge ${cls}`}>{upper}</span>;
}

export default function LogTable({ logs }: Props) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const severities = ["ALL", ...severityOrder.filter((s) =>
    logs.some((l) => l.severity.toUpperCase() === s)
  )];

  const filtered = logs.filter((l) => {
    const matchSev = filter === "ALL" || l.severity.toUpperCase() === filter;
    const matchSearch =
      search === "" ||
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.service_name.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "6px 12px",
            color: "var(--text-primary)",
            fontSize: "0.8rem",
            outline: "none",
            width: "220px",
          }}
        />
        <div style={{ display: "flex", gap: "4px" }}>
          {severities.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: filter === s ? "600" : "400",
                cursor: "pointer",
                border: "1px solid",
                borderColor: filter === s ? "var(--accent)" : "var(--border)",
                background: filter === s ? "var(--accent-glow)" : "transparent",
                color: filter === s ? "var(--accent-bright)" : "var(--text-muted)",
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length} entries
        </span>
      </div>

      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 100px 100px 1fr",
          gap: "0.75rem",
          padding: "6px 10px",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span>Timestamp</span>
        <span>Service</span>
        <span>Severity</span>
        <span>Message</span>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "600px", overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "2rem", textAlign: "center" }}>
            No logs match the current filter.
          </div>
        )}
        {filtered.map((log) => (
          <div
            key={log.log_id}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 100px 100px 1fr",
              gap: "0.75rem",
              padding: "8px 10px",
              borderRadius: "4px",
              background: log.severity.toUpperCase() === "ERROR"
                ? "rgba(239,68,68,0.05)"
                : "var(--bg-secondary)",
              border: "1px solid",
              borderColor: log.severity.toUpperCase() === "ERROR"
                ? "rgba(239,68,68,0.2)"
                : "var(--border)",
              alignItems: "start",
            }}
          >
            <span
              className="mono"
              style={{ color: "var(--text-muted)", fontSize: "0.7rem", paddingTop: "2px" }}
            >
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {log.service_name}
            </span>
            <SeverityBadge severity={log.severity} />
            <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", wordBreak: "break-word" }}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}