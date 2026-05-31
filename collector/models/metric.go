package models

import "time"

type Metric struct {
	MetricID    string            `json:"metric_id"`
	ServiceName string            `json:"service_name"`
	MetricName  string            `json:"metric_name"`
	Value       float64           `json:"value"`
	Timestamp   time.Time         `json:"timestamp"`
	Labels      map[string]string `json:"labels"`
}
