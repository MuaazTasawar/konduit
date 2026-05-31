CREATE TABLE IF NOT EXISTS konduit.logs
(
    log_id          String,
    trace_id        String,
    span_id         String,
    service_name    String,
    severity        String,
    message         String,
    timestamp       DateTime64(3, 'UTC'),
    attributes      Map(String, String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service_name, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY;