export interface ComplianceResult {
  allowed: boolean;
  reason?: string;
  matchedList?: string;
  matchedEntry?: string;
}

export interface ComplianceProvider {
  name: string;
  /** Check if an address is sanctioned */
  check(address: string): Promise<ComplianceResult>;
  /** Whether the provider is ready (data loaded) */
  isReady(): boolean;
  /** Get provider stats for health endpoint */
  getStats(): { addressCount: number; lastRefresh: Date | null };
  /** Start the provider (load initial data, set up refresh) */
  start(): Promise<void>;
  /** Stop the provider (clear refresh timers) */
  stop(): void;
}
