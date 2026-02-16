"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHAIN_COLORS: Record<string, string> = {
  "eip155:8453": "#0052FF",   // Base blue
  "eip155:84532": "#668CFF",  // Base Sepolia lighter blue
  "eip155:137": "#8247E5",    // Polygon purple
  "eip155:80002": "#A87BF0",  // Polygon Amoy lighter purple
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "#14F195", // Solana green
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": "#7DF8CA", // Solana devnet lighter green
};

const DEFAULT_COLOR = "#6B7280";

interface VolumeByChainData {
  chainId: string;
  volume: string;
  count: number;
}

interface DailyVolumeData {
  date: string;
  volume: string;
  count: number;
}

export function VolumeByChainChart({ data }: { data: VolumeByChainData[] }) {
  const chartData = data.map((row) => ({
    chain: row.chainId.split(":").pop() ?? row.chainId,
    fullId: row.chainId,
    volume: Number(row.volume) / 1_000_000,
    count: row.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="chain" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)} USDC`, "Volume"]}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={CHAIN_COLORS[entry.fullId] ?? DEFAULT_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailyVolumeChart({ data }: { data: DailyVolumeData[] }) {
  const chartData = data.map((row) => ({
    date: row.date.slice(5), // "MM-DD"
    volume: Number(row.volume) / 1_000_000,
    count: row.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)} USDC`, "Volume"]}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <Line type="monotone" dataKey="volume" stroke="#0052FF" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
