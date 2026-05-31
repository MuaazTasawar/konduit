package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/MuaazTasawar/konduit/collector/db"
	"github.com/MuaazTasawar/konduit/collector/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IngestLogRequest struct {
	TraceID     string            `json:"trace_id"`
	SpanID      string            `json:"span_id"`
	ServiceName string            `json:"service_name" binding:"required"`
	Severity    string            `json:"severity" binding:"required"`
	Message     string            `json:"message" binding:"required"`
	Timestamp   time.Time         `json:"timestamp"`
	Attributes  map[string]string `json:"attributes"`
}

func IngestLog(c *gin.Context) {
	var req IngestLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Timestamp.IsZero() {
		req.Timestamp = time.Now().UTC()
	}
	if req.Attributes == nil {
		req.Attributes = map[string]string{}
	}

	logEntry := models.Log{
		LogID:       uuid.New().String(),
		TraceID:     req.TraceID,
		SpanID:      req.SpanID,
		ServiceName: req.ServiceName,
		Severity:    req.Severity,
		Message:     req.Message,
		Timestamp:   req.Timestamp,
		Attributes:  req.Attributes,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.InsertLog(ctx, logEntry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert log: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "log ingested",
		"log_id":  logEntry.LogID,
	})
}

func GetLogs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 1000 {
		limit = 100
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	logs, err := db.GetRecentLogs(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch logs: " + err.Error()})
		return
	}

	if logs == nil {
		logs = []models.Log{}
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"count": len(logs),
	})
}
