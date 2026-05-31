package models

import "time"

type Trace struct {
	TraceID       string            `json:"trace_id"`
	SpanID        string            `json:"span_id"`
	ParentSpanID  string            `json:"parent_span_id"`
	ServiceName   string            `json:"service_name"`
	OperationName string            `json:"operation_name"`
	StartTime     time.Time         `json:"start_time"`
	EndTime       time.Time         `json:"end_time"`
	DurationMs    float64           `json:"duration_ms"`
	StatusCode    uint8             `json:"status_code"`
	StatusMessage string            `json:"status_message"`
	Attributes    map[string]string `json:"attributes"`
}
