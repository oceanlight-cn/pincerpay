"use client";

import { useState } from "react";

type SortDir = "asc" | "desc";

function useSortable<T>(data: T[], defaultKey: keyof T, defaultDir: SortDir = "desc") {
  const [sortKey, setSortKey] = useState<keyof T>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    const sa = String(av);
    const sb = String(bv);
    return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
  });

  function toggle(key: keyof T) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const indicator = (key: keyof T) =>
    key === sortKey ? (sortDir === "asc" ? " \u25B2" : " \u25BC") : "";

  return { sorted, toggle, indicator };
}

const thClass = "text-left text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2 cursor-pointer select-none hover:text-[var(--foreground)] transition-colors";
const tdClass = "py-2 border-b border-[var(--border)]";

function truncate(s: string, len = 12) {
  if (s.length <= len) return s;
  return s.slice(0, 6) + "..." + s.slice(-4);
}

function formatUsdc(baseUnits: string | number) {
  return "$" + (Number(baseUnits) / 1_000_000).toFixed(2);
}

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Merchant Table ---

export interface MerchantRow {
  name: string;
  wallet: string;
  chains: string;
  txns: number;
  volume: number;
  lastActive: string | null;
  created: string;
}

export function MerchantTable({ data }: { data: MerchantRow[] }) {
  const { sorted, toggle, indicator } = useSortable(data, "volume");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={thClass} onClick={() => toggle("name")}>Name{indicator("name")}</th>
            <th className={thClass}>Wallet</th>
            <th className={thClass} onClick={() => toggle("chains")}>Chains{indicator("chains")}</th>
            <th className={thClass} onClick={() => toggle("txns")}>Txns{indicator("txns")}</th>
            <th className={thClass} onClick={() => toggle("volume")}>Volume{indicator("volume")}</th>
            <th className={thClass} onClick={() => toggle("lastActive")}>Last Active{indicator("lastActive")}</th>
            <th className={thClass} onClick={() => toggle("created")}>Created{indicator("created")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => (
            <tr key={i}>
              <td className={tdClass}>{m.name}</td>
              <td className={`${tdClass} font-mono`}>{truncate(m.wallet)}</td>
              <td className={tdClass}>{m.chains || "-"}</td>
              <td className={tdClass}>{m.txns}</td>
              <td className={tdClass}>{formatUsdc(m.volume)}</td>
              <td className={tdClass}>{formatDate(m.lastActive)}</td>
              <td className={tdClass}>{formatDate(m.created)}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={7} className={`${tdClass} text-[var(--muted-foreground)]`}>No merchants</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Agent Table ---

export interface AgentRow {
  name: string;
  address: string;
  merchant: string;
  txns: number;
  volume: number;
  status: string;
  lastActive: string | null;
}

const statusColors: Record<string, string> = {
  active: "text-green-400",
  paused: "text-yellow-400",
  revoked: "text-red-400",
};

export function AgentTable({ data }: { data: AgentRow[] }) {
  const { sorted, toggle, indicator } = useSortable(data, "volume");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={thClass} onClick={() => toggle("name")}>Name{indicator("name")}</th>
            <th className={thClass}>Address</th>
            <th className={thClass} onClick={() => toggle("merchant")}>Merchant{indicator("merchant")}</th>
            <th className={thClass} onClick={() => toggle("txns")}>Txns{indicator("txns")}</th>
            <th className={thClass} onClick={() => toggle("volume")}>Volume{indicator("volume")}</th>
            <th className={thClass} onClick={() => toggle("status")}>Status{indicator("status")}</th>
            <th className={thClass} onClick={() => toggle("lastActive")}>Last Active{indicator("lastActive")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => (
            <tr key={i}>
              <td className={tdClass}>{a.name}</td>
              <td className={`${tdClass} font-mono`}>{truncate(a.address)}</td>
              <td className={tdClass}>{a.merchant}</td>
              <td className={tdClass}>{a.txns}</td>
              <td className={tdClass}>{formatUsdc(a.volume)}</td>
              <td className={`${tdClass} ${statusColors[a.status] ?? ""}`}>{a.status}</td>
              <td className={tdClass}>{formatDate(a.lastActive)}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={7} className={`${tdClass} text-[var(--muted-foreground)]`}>No agents</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Endpoint Table ---

export interface EndpointRow {
  endpoint: string;
  volume: number;
  txns: number;
}

export function EndpointTable({ data }: { data: EndpointRow[] }) {
  const { sorted, toggle, indicator } = useSortable(data, "volume");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={thClass} onClick={() => toggle("endpoint")}>Endpoint{indicator("endpoint")}</th>
            <th className={thClass} onClick={() => toggle("volume")}>Volume{indicator("volume")}</th>
            <th className={thClass} onClick={() => toggle("txns")}>Txns{indicator("txns")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => (
            <tr key={i}>
              <td className={`${tdClass} font-mono`}>{e.endpoint || "(unknown)"}</td>
              <td className={tdClass}>{formatUsdc(e.volume)}</td>
              <td className={tdClass}>{e.txns}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={3} className={`${tdClass} text-[var(--muted-foreground)]`}>No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
