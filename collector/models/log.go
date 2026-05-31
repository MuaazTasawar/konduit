package models

import "time"

type Log struct {
	LogID       string            `json:"log_id"`
	TraceID     string            `json:"trace_id"`
	SpanID      string            `json:"span_id"`
	ServiceName string            `json:"service_name"`
	Severity    string            `json:"severity"`
	Message     string            `json:"message"`
	Timestamp   time.Time         `json:"timestamp"`
	Attributes  map[string]string `json:"attributes"`
}
