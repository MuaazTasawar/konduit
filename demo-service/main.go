package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const collectorURL = "http://localhost:4317"

var services = []string{"auth-service", "payment-service", "user-service"}

// --- Payload types matching collector API ---

type TracePayload struct {
	TraceID       string            `json:"trace_id"`
	SpanID        string            `json:"span_id"`
	ParentSpanID  string            `json:"parent_span_id"`
	ServiceName   string            `json:"service_name"`
	OperationName string            `json:"operation_name"`
	StartTime     time.Time         `json:"start_time"`
	EndTime       time.Time         `json:"end_time"`
	StatusCode    uint8             `json:"status_code"`
	StatusMessage string            `json:"status_message"`
	Attributes    map[string]string `json:"attributes"`
}

type LogPayload struct {
	TraceID     string            `json:"trace_id"`
	SpanID      string            `json:"span_id"`
	ServiceName string            `json:"service_name"`
	Severity    string            `json:"severity"`
	Message     string            `json:"message"`
	Timestamp   time.Time         `json:"timestamp"`
	Attributes  map[string]string `json:"attributes"`
}

type MetricPayload struct {
	ServiceName string            `json:"service_name"`
	MetricName  string            `json:"metric_name"`
	Value       float64           `json:"value"`
	Timestamp   time.Time         `json:"timestamp"`
	Labels      map[string]string `json:"labels"`
}

// --- HTTP helpers ---

func post(path string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	resp, err := http.Post(collectorURL+path, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("collector returned %d", resp.StatusCode)
	}
	return nil
}

// --- Simulation logic ---

func simulateRequest(serviceName string, forceError bool) {
	traceID := uuid.New().String()
	spanID := uuid.New().String()
	startTime := time.Now().UTC()

	// Simulate processing time
	latencyMs := 20 + rand.Intn(180)
	if forceError {
		latencyMs = 800 + rand.Intn(1200) // errors are slow
	}
	time.Sleep(time.Duration(latencyMs) * time.Millisecond)
	endTime := time.Now().UTC()

	statusCode := uint8(0) // 0 = OK
	statusMsg := "OK"
	severity := "INFO"
	logMsg := fmt.Sprintf("Handled request in %dms", latencyMs)

	if forceError {
		statusCode = 2 // ERROR
		statusMsg = "internal error: downstream timeout"
		severity = "ERROR"
		logMsg = fmt.Sprintf("Request failed after %dms: downstream timeout", latencyMs)
	}

	operations := map[string][]string{
		"auth-service":    {"ValidateToken", "RefreshToken", "Login", "Logout"},
		"payment-service": {"ProcessPayment", "RefundPayment", "GetBalance", "CreateOrder"},
		"user-service":    {"GetUser", "UpdateUser", "DeleteUser", "ListUsers"},
	}

	ops := operations[serviceName]
	if ops == nil {
		ops = []string{"HandleRequest"}
	}
	operation := ops[rand.Intn(len(ops))]

	// Send trace
	trace := TracePayload{
		TraceID:       traceID,
		SpanID:        spanID,
		ServiceName:   serviceName,
		OperationName: operation,
		StartTime:     startTime,
		EndTime:       endTime,
		StatusCode:    statusCode,
		StatusMessage: statusMsg,
		Attributes: map[string]string{
			"http.method":      "POST",
			"http.status_code": fmt.Sprintf("%d", 200+int(statusCode)*300),
			"latency_ms":       fmt.Sprintf("%d", latencyMs),
		},
	}
	if err := post("/api/v1/traces", trace); err != nil {
		log.Printf("⚠️  trace send failed for %s: %v", serviceName, err)
	}

	// Send log
	logEntry := LogPayload{
		TraceID:     traceID,
		SpanID:      spanID,
		ServiceName: serviceName,
		Severity:    severity,
		Message:     logMsg,
		Timestamp:   endTime,
		Attributes: map[string]string{
			"operation": operation,
		},
	}
	if err := post("/api/v1/logs", logEntry); err != nil {
		log.Printf("⚠️  log send failed for %s: %v", serviceName, err)
	}
}

func simulateMetrics(serviceName string, errorRate float64) {
	metric := MetricPayload{
		ServiceName: serviceName,
		MetricName:  "error_rate",
		Value:       errorRate,
		Timestamp:   time.Now().UTC(),
		Labels: map[string]string{
			"env": "demo",
		},
	}
	if err := post("/api/v1/metrics", metric); err != nil {
		log.Printf("⚠️  metric send failed for %s: %v", serviceName, err)
	}

	// Also send request latency metric
	latency := MetricPayload{
		ServiceName: serviceName,
		MetricName:  "avg_latency_ms",
		Value:       float64(50 + rand.Intn(200)),
		Timestamp:   time.Now().UTC(),
		Labels:      map[string]string{"env": "demo"},
	}
	if err := post("/api/v1/metrics", latency); err != nil {
		log.Printf("⚠️  latency metric send failed for %s: %v", serviceName, err)
	}
}

// runServiceSimulator runs a continuous simulation loop for one service.
// Every ~3s it sends a normal request + metrics.
// Every ~60s it triggers an error spike lasting ~15s.
func runServiceSimulator(serviceName string) {
	log.Printf("🚀 Starting simulator for %s", serviceName)

	tickerNormal := time.NewTicker(3 * time.Second)
	tickerSpike := time.NewTicker(time.Duration(60+rand.Intn(60)) * time.Second)

	spikeActive := false
	spikeEnd := time.Time{}

	for {
		select {
		case <-tickerNormal.C:
			forceError := spikeActive && time.Now().Before(spikeEnd)
			if !forceError && spikeActive {
				spikeActive = false
				log.Printf("✅ [%s] spike ended, returning to baseline", serviceName)
			}

			go simulateRequest(serviceName, forceError)

			errorRate := 0.01 + rand.Float64()*0.03 // baseline 1-4%
			if forceError {
				errorRate = 0.7 + rand.Float64()*0.3 // spike 70-100%
			}
			simulateMetrics(serviceName, errorRate)

		case <-tickerSpike.C:
			spikeActive = true
			spikeEnd = time.Now().Add(15 * time.Second)
			log.Printf("🚨 [%s] INJECTING ERROR SPIKE for 15s", serviceName)
			// Reset spike ticker with new random interval
			tickerSpike.Reset(time.Duration(60+rand.Intn(60)) * time.Second)
		}
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Wait for collector to be ready
	log.Println("⏳ Waiting for collector to be ready...")
	for i := 0; i < 10; i++ {
		resp, err := http.Get(collectorURL + "/health")
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			log.Println("✅ Collector is ready")
			break
		}
		if i == 9 {
			log.Fatal("❌ Collector not reachable after 10 attempts. Is it running?")
		}
		time.Sleep(2 * time.Second)
	}

	// Start a simulator goroutine per service
	for _, svc := range services {
		go runServiceSimulator(svc)
	}

	// Expose a simple status endpoint
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":   "ok",
			"service":  "konduit-demo",
			"services": services,
		})
	})

	r.GET("/spike/:service", func(c *gin.Context) {
		// Manual spike trigger for demos
		svc := c.Param("service")
		go func() {
			log.Printf("🚨 [%s] MANUAL SPIKE triggered via API", svc)
			for i := 0; i < 20; i++ {
				simulateRequest(svc, true)
				simulateMetrics(svc, 0.8+rand.Float64()*0.2)
				time.Sleep(500 * time.Millisecond)
			}
			log.Printf("✅ [%s] manual spike complete", svc)
		}()
		c.JSON(200, gin.H{"message": fmt.Sprintf("spike injected into %s", svc)})
	})

	log.Printf("🌐 Demo service status at http://localhost:%s/health", port)
	log.Printf("💡 Trigger a manual spike: GET http://localhost:%s/spike/auth-service", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
