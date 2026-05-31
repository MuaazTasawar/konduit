CREATE DATABASE IF NOT EXISTS konduit;

CREATE TABLE IF NOT EXISTS konduit.traces
(
    trace_id        String,
    span_id         String,
    parent_span_id  String,
    service_name    String,
    operation_name  String,
    start_time      DateTime64(3, 'UTC'),
    end_time        DateTime64(3, 'UTC'),
    duration_ms     Float64,
    status_code     UInt8,
    status_message  String,
    attributes      Map(String, String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(start_time)
ORDER BY (service_name, start_time, trace_id)
TTL toDateTime(start_time) + INTERVAL 30 DAY;