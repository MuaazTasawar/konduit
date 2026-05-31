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

type IngestTraceRequest struct {
	TraceID       string            `json:"trace_id"`
	SpanID        string            `json:"span_id"`
	ParentSpanID  string            `json:"parent_span_id"`
	ServiceName   string            `json:"service_name" binding:"required"`
	OperationName string            `json:"operation_name" binding:"required"`
	StartTime     time.Time         `json:"start_time" binding:"required"`
	EndTime       time.Time         `json:"end_time" binding:"required"`
	StatusCode    uint8             `json:"status_code"`
	StatusMessage string            `json:"status_message"`
	Attributes    map[string]string `json:"attributes"`
}

func IngestTrace(c *gin.Context) {
	var req IngestTraceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TraceID == "" {
		req.TraceID = uuid.New().String()
	}
	if req.SpanID == "" {
		req.SpanID = uuid.New().String()
	}
	if req.Attributes == nil {
		req.Attributes = map[string]string{}
	}

	durationMs := float64(req.EndTime.Sub(req.StartTime).Milliseconds())

	trace := models.Trace{
		TraceID:       req.TraceID,
		SpanID:        req.SpanID,
		ParentSpanID:  req.ParentSpanID,
		ServiceName:   req.ServiceName,
		OperationName: req.OperationName,
		StartTime:     req.StartTime,
		EndTime:       req.EndTime,
		DurationMs:    durationMs,
		StatusCode:    req.StatusCode,
		StatusMessage: req.StatusMessage,
		Attributes:    req.Attributes,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.InsertTrace(ctx, trace); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert trace: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "trace ingested",
		"trace_id": trace.TraceID,
		"span_id":  trace.SpanID,
	})
}

func GetTraces(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 500 {
		limit = 50
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	traces, err := db.GetRecentTraces(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch traces: " + err.Error()})
		return
	}

	if traces == nil {
		traces = []models.Trace{}
	}

	c.JSON(http.StatusOK, gin.H{
		"traces": traces,
		"count":  len(traces),
	})
}

func GetTraceByID(c *gin.Context) {
	traceID := c.Param("trace_id")
	if traceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "trace_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	spans, err := db.GetTracesByID(ctx, traceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch trace: " + err.Error()})
		return
	}

	if spans == nil {
		spans = []models.Trace{}
	}

	c.JSON(http.StatusOK, gin.H{
		"trace_id": traceID,
		"spans":    spans,
		"count":    len(spans),
	})
}
