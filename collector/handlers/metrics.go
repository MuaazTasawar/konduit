package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/MuaazTasawar/konduit/collector/anomaly"
	"github.com/MuaazTasawar/konduit/collector/db"
	"github.com/MuaazTasawar/konduit/collector/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IngestMetricRequest struct {
	ServiceName string            `json:"service_name" binding:"required"`
	MetricName  string            `json:"metric_name" binding:"required"`
	Value       float64           `json:"value"`
	Timestamp   time.Time         `json:"timestamp"`
	Labels      map[string]string `json:"labels"`
}

type AnomalyResponse struct {
	ServiceName  string    `json:"service_name"`
	MetricName   string    `json:"metric_name"`
	DetectedAt   time.Time `json:"detected_at"`
	CurrentValue float64   `json:"current_value"`
	ZScore       float64   `json:"z_score"`
	Hypothesis   string    `json:"hypothesis"`
}

var anomalyStore []AnomalyResponse

func IngestMetric(c *gin.Context) {
	var req IngestMetricRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Timestamp.IsZero() {
		req.Timestamp = time.Now().UTC()
	}
	if req.Labels == nil {
		req.Labels = map[string]string{}
	}

	metric := models.Metric{
		MetricID:    uuid.New().String(),
		ServiceName: req.ServiceName,
		MetricName:  req.MetricName,
		Value:       req.Value,
		Timestamp:   req.Timestamp,
		Labels:      req.Labels,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.InsertMetric(ctx, metric); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert metric: " + err.Error()})
		return
	}

	// Run anomaly detection on error_rate metrics
	if req.MetricName == "error_rate" {
		go func() {
			bgCtx, bgCancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer bgCancel()

			series, err := db.GetErrorRateSeries(bgCtx, req.ServiceName, 60)
			if err != nil || len(series) == 0 {
				return
			}

			values := make([]float64, len(series))
			for i, m := range series {
				values[i] = m.Value
			}

			detected, zScore := anomaly.DetectZScore(values)
			if detected {
				hypothesis, err := anomaly.GenerateHypothesis(bgCtx, req.ServiceName, req.Value, zScore, series)
				if err != nil {
					hypothesis = "Anomaly detected but hypothesis generation failed."
				}

				anomalyStore = append(anomalyStore, AnomalyResponse{
					ServiceName:  req.ServiceName,
					MetricName:   req.MetricName,
					DetectedAt:   time.Now().UTC(),
					CurrentValue: req.Value,
					ZScore:       zScore,
					Hypothesis:   hypothesis,
				})
			}
		}()
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "metric ingested",
		"metric_id": metric.MetricID,
	})
}

func GetMetrics(c *gin.Context) {
	serviceName := c.DefaultQuery("service", "")
	metricName := c.DefaultQuery("metric", "error_rate")
	limitStr := c.DefaultQuery("limit", "100")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 1000 {
		limit = 100
	}

	if serviceName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "service query param is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	metrics, err := db.GetRecentMetrics(ctx, serviceName, metricName, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch metrics: " + err.Error()})
		return
	}

	if metrics == nil {
		metrics = []models.Metric{}
	}

	c.JSON(http.StatusOK, gin.H{
		"metrics": metrics,
		"count":   len(metrics),
	})
}

func GetAnomalies(c *gin.Context) {
	if anomalyStore == nil {
		anomalyStore = []AnomalyResponse{}
	}

	// Return last 50 anomalies, newest first
	result := anomalyStore
	if len(result) > 50 {
		result = result[len(result)-50:]
	}

	// Reverse so newest is first
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	c.JSON(http.StatusOK, gin.H{
		"anomalies": result,
		"count":     len(result),
	})
}
