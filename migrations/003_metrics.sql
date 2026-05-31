CREATE TABLE IF NOT EXISTS konduit.metrics
(
    metric_id       String,
    service_name    String,
    metric_name     String,
    value           Float64,
    timestamp       DateTime64(3, 'UTC'),
    labels          Map(String, String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service_name, metric_name, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY;