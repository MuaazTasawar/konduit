package anomaly

import (
	"context"
	"fmt"
	"math"
	"os"
	"strconv"

	"github.com/MuaazTasawar/konduit/collector/ai"
	"github.com/MuaazTasawar/konduit/collector/models"
)

// DetectZScore returns (isAnomaly, zScore) for the latest value in the series.
// Requires at least ANOMALY_MIN_SAMPLES points before activating.
func DetectZScore(values []float64) (bool, float64) {
	minSamples := 10
	if v, err := strconv.Atoi(os.Getenv("ANOMALY_MIN_SAMPLES")); err == nil && v > 0 {
		minSamples = v
	}

	threshold := 2.5
	if v, err := strconv.ParseFloat(os.Getenv("ANOMALY_ZSCORE_THRESHOLD"), 64); err == nil && v > 0 {
		threshold = v
	}

	if len(values) < minSamples {
		return false, 0
	}

	// Mean
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))

	// Standard deviation
	variance := 0.0
	for _, v := range values {
		diff := v - mean
		variance += diff * diff
	}
	stddev := math.Sqrt(variance / float64(len(values)))

	if stddev == 0 {
		return false, 0
	}

	latest := values[len(values)-1]
	zScore := (latest - mean) / stddev

	return zScore > threshold, zScore
}

// GenerateHypothesis builds a structured prompt from the metric series and
// calls Gemini to produce a plain-English root cause hypothesis.
func GenerateHypothesis(
	ctx context.Context,
	serviceName string,
	currentValue float64,
	zScore float64,
	series []models.Metric,
) (string, error) {
	// Build a compact time-series summary for the prompt
	seriesSummary := ""
	start := 0
	if len(series) > 20 {
		start = len(series) - 20
	}
	for _, m := range series[start:] {
		seriesSummary += fmt.Sprintf("  [%s] error_rate=%.4f\n",
			m.Timestamp.Format("15:04:05"), m.Value)
	}

	prompt := fmt.Sprintf(`You are an expert site reliability engineer analyzing a production anomaly.

Service: %s
Anomaly: error_rate spiked to %.4f (z-score: %.2f standard deviations above baseline)

Recent error_rate time series (last %d samples):
%s

Based on this data, provide a concise root cause hypothesis in 2-3 sentences.
Focus on the most likely technical cause (e.g. connection pool exhaustion, 
memory pressure, downstream timeout cascade, retry storm, traffic spike).
Be specific about timing and service-level details visible in the data.
Do not use bullet points. Respond with plain text only.`,
		serviceName,
		currentValue,
		zScore,
		len(series[start:]),
		seriesSummary,
	)

	hypothesis, err := ai.CallGemini(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("gemini call failed: %w", err)
	}

	return hypothesis, nil
}
