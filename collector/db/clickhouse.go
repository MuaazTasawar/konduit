package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/MuaazTasawar/konduit/collector/models"
)

var DB driver.Conn

func Connect() error {
	host := os.Getenv("CLICKHOUSE_HOST")
	port := os.Getenv("CLICKHOUSE_PORT")
	database := os.Getenv("CLICKHOUSE_DB")
	username := os.Getenv("CLICKHOUSE_USER")
	password := os.Getenv("CLICKHOUSE_PASSWORD")

	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{fmt.Sprintf("%s:%s", host, port)},
		Auth: clickhouse.Auth{
			Database: database,
			Username: username,
			Password: password,
		},
		DialTimeout:     10 * time.Second,
		MaxOpenConns:    10,
		MaxIdleConns:    5,
		ConnMaxLifetime: time.Hour,
		Protocol:        clickhouse.HTTP,
	})
	if err != nil {
		return fmt.Errorf("failed to open clickhouse connection: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := conn.Ping(ctx); err != nil {
		return fmt.Errorf("failed to ping clickhouse: %w", err)
	}

	DB = conn
	log.Println("✅ Connected to ClickHouse")
	return nil
}

func InsertTrace(ctx context.Context, t models.Trace) error {
	query := `INSERT INTO konduit.traces 
		(trace_id, span_id, parent_span_id, service_name, operation_name, 
		 start_time, end_time, duration_ms, status_code, status_message, attributes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	return DB.Exec(ctx, query,
		t.TraceID, t.SpanID, t.ParentSpanID, t.ServiceName, t.OperationName,
		t.StartTime, t.EndTime, t.DurationMs, t.StatusCode, t.StatusMessage,
		t.Attributes,
	)
}

func InsertLog(ctx context.Context, l models.Log) error {
	query := `INSERT INTO konduit.logs
		(log_id, trace_id, span_id, service_name, severity, message, timestamp, attributes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	return DB.Exec(ctx, query,
		l.LogID, l.TraceID, l.SpanID, l.ServiceName, l.Severity,
		l.Message, l.Timestamp, l.Attributes,
	)
}

func InsertMetric(ctx context.Context, m models.Metric) error {
	query := `INSERT INTO konduit.metrics
		(metric_id, service_name, metric_name, value, timestamp, labels)
		VALUES (?, ?, ?, ?, ?, ?)`

	return DB.Exec(ctx, query,
		m.MetricID, m.ServiceName, m.MetricName, m.Value, m.Timestamp, m.Labels,
	)
}

func GetRecentTraces(ctx context.Context, limit int) ([]models.Trace, error) {
	rows, err := DB.Query(ctx, `
		SELECT trace_id, span_id, parent_span_id, service_name, operation_name,
		       start_time, end_time, duration_ms, status_code, status_message, attributes
		FROM konduit.traces
		ORDER BY start_time DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var traces []models.Trace
	for rows.Next() {
		var t models.Trace
		if err := rows.Scan(
			&t.TraceID, &t.SpanID, &t.ParentSpanID, &t.ServiceName, &t.OperationName,
			&t.StartTime, &t.EndTime, &t.DurationMs, &t.StatusCode, &t.StatusMessage,
			&t.Attributes,
		); err != nil {
			return nil, err
		}
		traces = append(traces, t)
	}
	return traces, nil
}

func GetRecentLogs(ctx context.Context, limit int) ([]models.Log, error) {
	rows, err := DB.Query(ctx, `
		SELECT log_id, trace_id, span_id, service_name, severity, message, timestamp, attributes
		FROM konduit.logs
		ORDER BY timestamp DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.Log
	for rows.Next() {
		var l models.Log
		if err := rows.Scan(
			&l.LogID, &l.TraceID, &l.SpanID, &l.ServiceName, &l.Severity,
			&l.Message, &l.Timestamp, &l.Attributes,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func GetRecentMetrics(ctx context.Context, serviceName string, metricName string, limit int) ([]models.Metric, error) {
	rows, err := DB.Query(ctx, `
		SELECT metric_id, service_name, metric_name, value, timestamp, labels
		FROM konduit.metrics
		WHERE service_name = ? AND metric_name = ?
		ORDER BY timestamp DESC
		LIMIT ?`, serviceName, metricName, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var metrics []models.Metric
	for rows.Next() {
		var m models.Metric
		if err := rows.Scan(
			&m.MetricID, &m.ServiceName, &m.MetricName, &m.Value, &m.Timestamp, &m.Labels,
		); err != nil {
			return nil, err
		}
		metrics = append(metrics, m)
	}
	return metrics, nil
}

func GetErrorRateSeries(ctx context.Context, serviceName string, windowMinutes int) ([]models.Metric, error) {
	rows, err := DB.Query(ctx, `
		SELECT metric_id, service_name, metric_name, value, timestamp, labels
		FROM konduit.metrics
		WHERE service_name = ?
		  AND metric_name = 'error_rate'
		  AND timestamp >= now() - INTERVAL ? MINUTE
		ORDER BY timestamp ASC`, serviceName, windowMinutes)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var metrics []models.Metric
	for rows.Next() {
		var m models.Metric
		if err := rows.Scan(
			&m.MetricID, &m.ServiceName, &m.MetricName, &m.Value, &m.Timestamp, &m.Labels,
		); err != nil {
			return nil, err
		}
		metrics = append(metrics, m)
	}
	return metrics, nil
}

func GetTracesByID(ctx context.Context, traceID string) ([]models.Trace, error) {
	rows, err := DB.Query(ctx, `
		SELECT trace_id, span_id, parent_span_id, service_name, operation_name,
		       start_time, end_time, duration_ms, status_code, status_message, attributes
		FROM konduit.traces
		WHERE trace_id = ?
		ORDER BY start_time ASC`, traceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var traces []models.Trace
	for rows.Next() {
		var t models.Trace
		if err := rows.Scan(
			&t.TraceID, &t.SpanID, &t.ParentSpanID, &t.ServiceName, &t.OperationName,
			&t.StartTime, &t.EndTime, &t.DurationMs, &t.StatusCode, &t.StatusMessage,
			&t.Attributes,
		); err != nil {
			return nil, err
		}
		traces = append(traces, t)
	}
	return traces, nil
}
