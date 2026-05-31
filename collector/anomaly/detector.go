package anomaly

import (
	"context"
	"math"

	"github.com/MuaazTasawar/konduit/collector/models"
)

// DetectZScore returns true if the last value in the series is an anomaly.
// Uses z-score: (value - mean) / stddev > threshold
func DetectZScore(values []float64) (bool, float64) {
	if len(values) < 10 {
		return false, 0
	}

	// Calculate mean
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))

	// Calculate standard deviation
	variance := 0.0
	for _, v := range values {
		diff := v - mean
		variance += diff * diff
	}
	stddev := math.Sqrt(variance / float64(len(values)))

	if stddev == 0 {
		return false, 0
	}

	// Z-score of the latest value
	latest := values[len(values)-1]
	zScore := (latest - mean) / stddev

	threshold := 2.5
	return zScore > threshold, zScore
}

// GenerateHypothesis is a stub — replaced in Phase 3 with real Gemini call
func GenerateHypothesis(ctx context.Context, serviceName string, currentValue float64, zScore float64, series []models.Metric) (string, error) {
	return "Anomaly detected. AI hypothesis generation coming in Phase 3.", nil
}
