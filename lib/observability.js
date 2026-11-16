/**
 * Structured Observability, Latency Metrics & Epistemic Provenance Tracker.
 *
 * Records bounded structured spans with correlation IDs, latency percentile
 * summaries (p50/p95/p99), failure counters, and `[EVIDENCE]` / `[INFERENCE]` /
 * `[UNKNOWN]` provenance annotations. All trace attributes pass through HOL Guard
 * secret redaction prior to storage.
 */

const crypto = require("crypto");
const { redactAndScanSecrets } = require("./hol-guard-policy");

const VALID_PROVENANCE_TAGS = new Set(["EVIDENCE", "INFERENCE", "UNKNOWN"]);

function tagProvenance(kind, statement, evidenceSource = null) {
  const normalized = String(kind || "UNKNOWN").toUpperCase();
  const tag = VALID_PROVENANCE_TAGS.has(normalized) ? normalized : "UNKNOWN";
  return {
    tag: `[${tag}]`,
    kind: tag,
    statement: String(statement || ""),
    evidenceSource: evidenceSource ? redactAndScanSecrets(evidenceSource).redacted : null,
  };
}

function computeLatencyPercentiles(valuesMs = []) {
  const numeric = valuesMs.filter((n) => typeof n === "number" && Number.isFinite(n)).sort((a, b) => a - b);
  if (numeric.length === 0) {
    return { count: 0, p50: 0, p95: 0, p99: 0, mean: 0, max: 0 };
  }
  const at = (q) => numeric[Math.min(numeric.length - 1, Math.floor(numeric.length * q))];
  const sum = numeric.reduce((acc, v) => acc + v, 0);
  return {
    count: numeric.length,
    p50: Number(at(0.5).toFixed(3)),
    p95: Number(at(0.95).toFixed(3)),
    p99: Number(at(0.99).toFixed(3)),
    mean: Number((sum / numeric.length).toFixed(3)),
    max: Number(numeric[numeric.length - 1].toFixed(3)),
  };
}

class ObservabilityRecorder {
  constructor(options = {}) {
    this.maxTraces = Number(options.maxTraces || 512);
    this.maxSamplesPerMetric = Number(options.maxSamplesPerMetric || 1024);
    this.spans = [];
    this.metrics = new Map();
    this.failures = [];
  }

  startSpan(phase, correlationId = null, metadata = {}) {
    const corrId = correlationId || crypto.randomUUID();
    const spanId = crypto.randomBytes(8).toString("hex");
    const startedAt = new Date().toISOString();
    const startNs = process.hrtime.bigint();
    const safeMeta = redactAndScanSecrets(metadata).redacted;
    let closed = false;

    const finish = (status = "ok", extra = {}) => {
      if (closed) return null;
      closed = true;
      const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
      const safeExtra = redactAndScanSecrets(extra).redacted;
      const record = {
        correlationId: corrId,
        spanId,
        phase,
        status,
        startedAt,
        durationMs: Number(durationMs.toFixed(3)),
        metadata: safeMeta,
        extra: safeExtra,
      };
      this.recordSpan(record);
      this.recordLatency(phase, durationMs);
      if (status !== "ok") {
        this.recordFailure(phase, corrId, safeExtra.error || status, safeExtra);
      }
      return record;
    };

    return { correlationId: corrId, spanId, finish };
  }

  recordSpan(spanRecord) {
    if (this.spans.length >= this.maxTraces) {
      this.spans.shift();
    }
    this.spans.push(redactAndScanSecrets(spanRecord).redacted);
  }

  recordLatency(metricName, valueMs) {
    if (!Number.isFinite(valueMs)) return;
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    const series = this.metrics.get(metricName);
    if (series.length >= this.maxSamplesPerMetric) {
      series.shift();
    }
    series.push(valueMs);
  }

  recordFailure(phase, correlationId, reason, details = {}) {
    if (this.failures.length >= this.maxTraces) {
      this.failures.shift();
    }
    this.failures.push({
      timestamp: new Date().toISOString(),
      correlationId,
      phase,
      reason: redactAndScanSecrets(String(reason || "unknown")).redacted,
      details: redactAndScanSecrets(details).redacted,
    });
  }

  getSummary() {
    const latencyMetrics = {};
    for (const [name, samples] of this.metrics.entries()) {
      latencyMetrics[name] = computeLatencyPercentiles(samples);
    }
    return {
      totalSpans: this.spans.length,
      totalFailures: this.failures.length,
      latencyMetrics,
      recentFailures: this.failures.slice(-10),
    };
  }
}

const defaultRecorder = new ObservabilityRecorder();

module.exports = {
  VALID_PROVENANCE_TAGS,
  tagProvenance,
  computeLatencyPercentiles,
  ObservabilityRecorder,
  defaultRecorder,
};
