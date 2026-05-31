const BASE_URL = process.env.NEXT_PUBLIC_COLLECTOR_URL || "http://localhost:4317";

export interface Trace {
  trace_id: string;
  span_id: string;
  parent_span_id: string;
  service_name: string;
  operation_name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  status_code: number;
  status_message: string;
  attributes: Record<string, string>;
}

export interface Log {
  log_id: string;
  trace_id: string;
  span_id: string;
  service_name: string;
  severity: string;
  message: string;
  timestamp: string;
  attributes: Record<string, string>;
}

export interface Metric {
  metric_id: string;
  service_name: string;
  metric_name: string;
  value: number;
  timestamp: string;
  labels: Record<string, string>;
}

export interface Anomaly {
  service_name: string;
  metric_name: string;
  detected_at: string;
  current_value: number;
  z_score: number;
  hypothesis: string;
}

export async function fetchTraces(limit = 50): Promise<Trace[]> {
  const res = await fetch(`${BASE_URL}/api/v1/traces?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch traces");
  const data = await res.json();
  return data.traces ?? [];
}

export async function fetchTraceByID(traceID: string): Promise<Trace[]> {
  const res = await fetch(`${BASE_URL}/api/v1/traces/${traceID}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch trace");
  const data = await res.json();
  return data.spans ?? [];
}

export async function fetchLogs(limit = 100): Promise<Log[]> {
  const res = await fetch(`${BASE_URL}/api/v1/logs?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch logs");
  const data = await res.json();
  return data.logs ?? [];
}

export async function fetchMetrics(
  service: string,
  metric = "error_rate",
  limit = 60
): Promise<Metric[]> {
  const res = await fetch(
    `${BASE_URL}/api/v1/metrics?service=${service}&metric=${metric}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch metrics");
  const data = await res.json();
  return data.metrics ?? [];
}

export async function fetchAnomalies(): Promise<Anomaly[]> {
  const res = await fetch(`${BASE_URL}/api/v1/anomalies`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  const data = await res.json();
  return data.anomalies ?? [];
}