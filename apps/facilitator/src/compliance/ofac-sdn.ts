import type { ComplianceProvider, ComplianceResult } from "./types.js";

const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdnlist.txt";

/**
 * Regex to match "Digital Currency Address" lines in the OFAC SDN list.
 * Format: "Digital Currency Address - XBT abc123def456;" or similar.
 * Captures the address portion after the coin identifier.
 */
const CRYPTO_ADDRESS_RE =
  /Digital Currency Address\s+-\s+\w+\s+([A-Za-z0-9]+)\s*;/g;

interface OfacSdnProviderOptions {
  /** Refresh interval in milliseconds (default: 24 hours) */
  refreshIntervalMs?: number;
  /** Logger instance (pino-compatible) */
  logger?: { info: (obj: object) => void; warn: (obj: object) => void; error: (obj: object) => void };
  /** Custom fetch URL (for testing) */
  url?: string;
}

export class OfacSdnProvider implements ComplianceProvider {
  readonly name = "OFAC SDN";

  private addresses = new Set<string>();
  private lastRefresh: Date | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private ready = false;

  private readonly refreshIntervalMs: number;
  private readonly logger: OfacSdnProviderOptions["logger"];
  private readonly url: string;

  constructor(options?: OfacSdnProviderOptions) {
    this.refreshIntervalMs = options?.refreshIntervalMs ?? 86_400_000;
    this.logger = options?.logger;
    this.url = options?.url ?? OFAC_SDN_URL;
  }

  async check(address: string): Promise<ComplianceResult> {
    if (!this.ready) {
      this.logger?.warn({ msg: "ofac_provider_not_ready", address });
      return { allowed: true, reason: "OFAC provider not yet loaded, allowing" };
    }

    // EVM addresses are case-insensitive (checksummed vs lowercase).
    // Solana addresses are case-sensitive (base58).
    // We store both original and lowercased for O(1) lookup.
    const blocked =
      this.addresses.has(address) || this.addresses.has(address.toLowerCase());

    if (blocked) {
      return {
        allowed: false,
        reason: "Address appears on OFAC SDN list",
        matchedList: "OFAC SDN",
        matchedEntry: address,
      };
    }

    return { allowed: true };
  }

  isReady(): boolean {
    return this.ready;
  }

  getStats(): { addressCount: number; lastRefresh: Date | null } {
    return {
      addressCount: this.addresses.size,
      lastRefresh: this.lastRefresh,
    };
  }

  async start(): Promise<void> {
    await this.refresh();

    this.refreshTimer = setInterval(() => {
      this.refresh().catch((err) => {
        this.logger?.error({
          msg: "ofac_refresh_error",
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, this.refreshIntervalMs);
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /** Fetch and parse the SDN list. On error, retains existing data. */
  private async refresh(): Promise<void> {
    try {
      const res = await fetch(this.url, {
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const text = await res.text();
      const newAddresses = new Set<string>();

      let match: RegExpExecArray | null;
      while ((match = CRYPTO_ADDRESS_RE.exec(text)) !== null) {
        const addr = match[1];
        newAddresses.add(addr);
        // Also store lowercased version for case-insensitive EVM lookups
        newAddresses.add(addr.toLowerCase());
      }

      this.addresses = newAddresses;
      this.lastRefresh = new Date();
      this.ready = true;

      this.logger?.info({
        msg: "ofac_sdn_refreshed",
        uniqueAddresses: newAddresses.size,
        url: this.url,
      });
    } catch (err) {
      this.logger?.warn({
        msg: "ofac_sdn_refresh_failed",
        error: err instanceof Error ? err.message : String(err),
        existingCount: this.addresses.size,
      });

      // If this is the first load, mark as ready anyway so we don't block traffic.
      // Addresses set stays empty, so all addresses are allowed (fail open).
      if (!this.ready) {
        this.ready = true;
        this.logger?.warn({
          msg: "ofac_provider_ready_without_data",
          hint: "All addresses will be allowed until successful refresh",
        });
      }
    }
  }
}
