/**
 * In-process metrics collector for the facilitator.
 * Tracks settlements, verification, latency percentiles, and errors.
 * Exposed via GET /metrics as JSON.
 */

const LATENCY_BUFFER_SIZE = 1000;

export class Metrics {
  private startedAt = Date.now();

  // Settlement counters
  private settleTotal = 0;
  private settleByChain: Record<string, number> = {};
  private settleByStatus: Record<string, number> = {};

  // Verify counters
  private verifyTotal = 0;
  private verifyValid = 0;
  private verifyInvalid = 0;

  // Latency ring buffers (ms)
  private settleLatencies: number[] = [];
  private verifyLatencies: number[] = [];

  // Error counters
  private errorTotal = 0;
  private errorByRoute: Record<string, number> = {};

  // Worker snapshots (set externally)
  private workerStats: Record<string, unknown> = {};

  recordSettle(chain: string, success: boolean, durationMs: number): void {
    this.settleTotal++;
    this.settleByChain[chain] = (this.settleByChain[chain] ?? 0) + 1;
    const status = success ? "success" : "failure";
    this.settleByStatus[status] = (this.settleByStatus[status] ?? 0) + 1;

    this.settleLatencies.push(durationMs);
    if (this.settleLatencies.length > LATENCY_BUFFER_SIZE) {
      this.settleLatencies.shift();
    }

    if (!success) {
      this.errorTotal++;
      this.errorByRoute["/v1/settle"] = (this.errorByRoute["/v1/settle"] ?? 0) + 1;
    }
  }

  recordVerify(valid: boolean, durationMs: number): void {
    this.verifyTotal++;
    if (valid) this.verifyValid++;
    else this.verifyInvalid++;

    this.verifyLatencies.push(durationMs);
    if (this.verifyLatencies.length > LATENCY_BUFFER_SIZE) {
      this.verifyLatencies.shift();
    }
  }

  recordError(route: string): void {
    this.errorTotal++;
    this.errorByRoute[route] = (this.errorByRoute[route] ?? 0) + 1;
  }

  setWorkerStats(stats: Record<string, unknown>): void {
    this.workerStats = stats;
  }

  snapshot(): MetricsSnapshot {
    return {
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      settlements: {
        total: this.settleTotal,
        byChain: { ...this.settleByChain },
        byStatus: { ...this.settleByStatus },
      },
      verifications: {
        total: this.verifyTotal,
        valid: this.verifyValid,
        invalid: this.verifyInvalid,
      },
      latency: {
        settle: percentiles(this.settleLatencies),
        verify: percentiles(this.verifyLatencies),
      },
      errors: {
        total: this.errorTotal,
        byRoute: { ...this.errorByRoute },
      },
      workers: this.workerStats,
    };
  }
}

export interface MetricsSnapshot {
  uptime: number;
  settlements: {
    total: number;
    byChain: Record<string, number>;
    byStatus: Record<string, number>;
  };
  verifications: {
    total: number;
    valid: number;
    invalid: number;
  };
  latency: {
    settle: LatencyPercentiles;
    verify: LatencyPercentiles;
  };
  errors: {
    total: number;
    byRoute: Record<string, number>;
  };
  workers: Record<string, unknown>;
}

export interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
  count: number;
}

function percentiles(values: number[]): LatencyPercentiles {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
    count: sorted.length,
  };
}
