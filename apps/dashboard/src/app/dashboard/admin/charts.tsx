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
} from "recharts";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
};

interface DailyTrendRow {
  date: string;
  volume: string;
  count: number;
}

interface SettlementRow {
  settlementType: string;
  volume: string;
  count: number;
}

interface SignupRow {
  date: string;
  merchants: number;
  agents: number;
}

export function DailyTrendChart({ data }: { data: DailyTrendRow[] }) {
  const chartData = data.map((row) => ({
    date: row.date.slice(5),
    volume: Number(row.volume) / 1_000_000,
    revenue: (Number(row.volume) / 1_000_000) * 0.01,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `$${value.toFixed(2)}`,
            name === "revenue" ? "Revenue (1%)" : "Volume",
          ]}
          contentStyle={tooltipStyle}
        />
        <Line type="monotone" dataKey="volume" stroke="#0052FF" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="revenue" stroke="#14F195" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SettlementChart({ data }: { data: SettlementRow[] }) {
  const chartData = data.map((row) => ({
    type: row.settlementType,
    volume: Number(row.volume) / 1_000_000,
    count: row.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="type" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)} USDC`, "Volume"]}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="volume" fill="#0052FF" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CumulativeSignupsChart({ data }: { data: SignupRow[] }) {
  let cumulativeMerchants = 0;
  let cumulativeAgents = 0;
  const chartData = data.map((row) => {
    cumulativeMerchants += row.merchants;
    cumulativeAgents += row.agents;
    return {
      date: row.date.slice(5),
      merchants: cumulativeMerchants,
      agents: cumulativeAgents,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="merchants" stroke="#0052FF" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="agents" stroke="#14F195" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DailyTxCountChart({ data }: { data: DailyTrendRow[] }) {
  const chartData = data.map((row) => ({
    date: row.date.slice(5),
    count: row.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip
          formatter={(value: number) => [value, "Transactions"]}
          contentStyle={tooltipStyle}
        />
        <Line type="monotone" dataKey="count" stroke="#8247E5" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
