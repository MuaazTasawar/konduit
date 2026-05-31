package main

import (
	"log"
	"os"

	"github.com/MuaazTasawar/konduit/collector/db"
	"github.com/MuaazTasawar/konduit/collector/handlers"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	if err := db.Connect(); err != nil {
		log.Fatalf("❌ Failed to connect to ClickHouse: %v", err)
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "konduit-collector"})
	})

	api := r.Group("/api/v1")
	{
		api.POST("/traces", handlers.IngestTrace)
		api.GET("/traces", handlers.GetTraces)
		api.GET("/traces/:trace_id", handlers.GetTraceByID)

		api.POST("/logs", handlers.IngestLog)
		api.GET("/logs", handlers.GetLogs)

		api.POST("/metrics", handlers.IngestMetric)
		api.GET("/metrics", handlers.GetMetrics)

		api.GET("/anomalies", handlers.GetAnomalies)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4317"
	}

	log.Printf("🚀 Konduit collector running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
