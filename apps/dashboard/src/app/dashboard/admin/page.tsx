import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import {
  merchants,
  transactions,
  agents,
  webhookDeliveries,
  complianceEvents,
} from "@pincerpay/db";
import { sql, gte, eq, and, desc } from "drizzle-orm";
import { VolumeByChainChart } from "../analytics/charts";
import {
  DailyTrendChart,
  SettlementChart,
  CumulativeSignupsChart,
  DailyTxCountChart,
} from "./charts";
import {
  MerchantTable,
  AgentTable,
  EndpointTable,
  type MerchantRow,
  type AgentRow,
  type EndpointRow,
} from "./tables";

const NPM_PACKAGES = ["core", "merchant", "agent", "solana", "mcp"];

async function fetchGitHub() {
  try {
    const res = await fetch("https://api.github.com/repos/ds1/pincerpay", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { stars: 0, forks: 0 };
    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
    };
  } catch {
    return { stars: 0, forks: 0 };
  }
}

async function fetchNpmDownloads() {
  const results: Record<string, number> = {};
  await Promise.all(
    NPM_PACKAGES.map(async (pkg) => {
      try {
        const res = await fetch(
          `https://api.npmjs.org/downloads/point/last-month/@pincerpay/${pkg}`,
          { next: { revalidate: 3600 } },
        );
        if (!res.ok) {
          results[pkg] = 0;
          return;
        }
        const data = await res.json();
        results[pkg] = data.downloads ?? 0;
      } catch {
        results[pkg] = 0;
      }
    }),
  );
  return results;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function fmt(baseUnits: string | number) {
  return "$" + (Number(baseUnits) / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(num: number, denom: number) {
  if (denom === 0) return "0%";
  return ((num / denom) * 100).toFixed(1) + "%";
}

export default async function AdminPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect("/dashboard");
  }

  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    github,
    npmDownloads,
    [allTimeStats],
    [stats30d],
    [stats7d],
    [stats24h],
    volumeByChain,
    settlementBreakdown,
    dailyTrend,
    [merchantCounts],
    merchantDetails,
    [agentCounts],
    agentDetails,
    topEndpoints,
    chainPrefs,
    webhookStats,
    complianceStats,
    signupData,
  ] = await Promise.all([
    // External APIs
    fetchGitHub(),
    fetchNpmDownloads(),

    // All-time volume stats
    db.select({
      totalTxns: sql<number>`count(*)`,
      totalVolume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      confirmedTxns: sql<number>`count(*) filter (where ${transactions.status} = 'confirmed')`,
      failedTxns: sql<number>`count(*) filter (where ${transactions.status} = 'failed')`,
      optimisticTxns: sql<number>`count(*) filter (where ${transactions.optimistic} = true)`,
      avgConfirmTime: sql<string>`coalesce(avg(extract(epoch from (${transactions.confirmedAt} - ${transactions.createdAt}))) filter (where ${transactions.confirmedAt} is not null), 0)`,
    }).from(transactions),

    // 30d stats
    db.select({
      totalTxns: sql<number>`count(*)`,
      totalVolume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
    }).from(transactions).where(gte(transactions.createdAt, thirtyDaysAgo)),

    // 7d stats
    db.select({
      totalVolume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
    }).from(transactions).where(gte(transactions.createdAt, sevenDaysAgo)),

    // 24h stats
    db.select({
      totalVolume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
    }).from(transactions).where(gte(transactions.createdAt, oneDayAgo)),

    // Volume by chain
    db.select({
      chainId: transactions.chainId,
      volume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      count: sql<number>`count(*)`,
    }).from(transactions).groupBy(transactions.chainId),

    // Settlement type breakdown
    db.select({
      settlementType: transactions.settlementType,
      volume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      count: sql<number>`count(*)`,
    }).from(transactions).groupBy(transactions.settlementType),

    // Daily trend (90d)
    db.select({
      date: sql<string>`date(${transactions.createdAt})`,
      volume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      count: sql<number>`count(*)`,
    }).from(transactions)
      .where(gte(transactions.createdAt, ninetyDaysAgo))
      .groupBy(sql`date(${transactions.createdAt})`)
      .orderBy(sql`date(${transactions.createdAt})`),

    // Merchant counts
    db.select({
      total: sql<number>`count(*)`,
      new30d: sql<number>`count(*) filter (where ${merchants.createdAt} >= ${thirtyDaysAgo})`,
      active30d: sql<number>`(select count(distinct ${transactions.merchantId}) from ${transactions} where ${transactions.createdAt} >= ${thirtyDaysAgo})`,
    }).from(merchants),

    // Merchant details
    db.select({
      name: merchants.name,
      wallet: merchants.walletAddress,
      chains: sql<string>`array_to_string(${merchants.supportedChains}, ', ')`,
      txns: sql<number>`count(${transactions.id})`,
      volume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      lastActive: sql<string>`max(${transactions.createdAt})`,
      created: merchants.createdAt,
    }).from(merchants)
      .leftJoin(transactions, eq(merchants.id, transactions.merchantId))
      .groupBy(merchants.id)
      .orderBy(desc(sql`coalesce(sum(${transactions.amount}::bigint), 0)`)),

    // Agent counts
    db.select({
      total: sql<number>`count(*)`,
      active30d: sql<number>`(select count(distinct ${transactions.agentId}) from ${transactions} where ${transactions.createdAt} >= ${thirtyDaysAgo} and ${transactions.agentId} is not null)`,
    }).from(agents),

    // Agent details
    db.select({
      name: agents.name,
      address: agents.solanaAddress,
      merchant: merchants.name,
      txns: sql<number>`count(${transactions.id})`,
      volume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      status: agents.status,
      lastActive: sql<string>`max(${transactions.createdAt})`,
    }).from(agents)
      .leftJoin(merchants, eq(agents.merchantId, merchants.id))
      .leftJoin(transactions, eq(agents.id, transactions.agentId))
      .groupBy(agents.id, merchants.name)
      .orderBy(desc(sql`coalesce(sum(${transactions.amount}::bigint), 0)`)),

    // Top endpoints
    db.select({
      endpoint: transactions.endpoint,
      volume: sql<string>`coalesce(sum(${transactions.amount}::bigint), 0)`,
      txns: sql<number>`count(*)`,
    }).from(transactions)
      .groupBy(transactions.endpoint)
      .orderBy(desc(sql`coalesce(sum(${transactions.amount}::bigint), 0)`))
      .limit(20),

    // Chain preferences (from merchant config)
    db.select({
      chain: sql<string>`unnest(${merchants.supportedChains})`,
      count: sql<number>`count(*)`,
    }).from(merchants)
      .groupBy(sql`unnest(${merchants.supportedChains})`)
      .orderBy(desc(sql`count(*)`)),

    // Webhook stats
    db.select({
      status: webhookDeliveries.status,
      count: sql<number>`count(*)`,
    }).from(webhookDeliveries).groupBy(webhookDeliveries.status),

    // Compliance stats
    db.select({
      result: complianceEvents.result,
      count: sql<number>`count(*)`,
    }).from(complianceEvents).groupBy(complianceEvents.result),

    // Cumulative signups (daily merchant + agent creation counts)
    db.select({
      date: sql<string>`d.date`,
      merchants: sql<number>`coalesce(m.count, 0)`,
      agents: sql<number>`coalesce(a.count, 0)`,
    }).from(
      sql`generate_series(${ninetyDaysAgo}::date, ${now}::date, '1 day') as d(date)
        left join lateral (select count(*)::int as count from ${merchants} where date(${merchants.createdAt}) = d.date) m on true
        left join lateral (select count(*)::int as count from ${agents} where date(${agents.createdAt}) = d.date) a on true`,
    ).orderBy(sql`d.date`),
  ]);

  // Computed values
  const totalVolume = Number(allTimeStats.totalVolume);
  const totalRevenue = totalVolume * 0.01;
  const volume30d = Number(stats30d.totalVolume);
  const avgTxSize = allTimeStats.totalTxns > 0 ? totalVolume / allTimeStats.totalTxns : 0;
  const monthlyRunRate = (volume30d * 0.01);

  const totalNpmDownloads = Object.values(npmDownloads).reduce((a, b) => a + b, 0);

  const totalWebhooks = webhookStats.reduce((a, b) => a + b.count, 0);
  const deliveredWebhooks = webhookStats.find((w) => w.status === "delivered")?.count ?? 0;

  const totalCompliance = complianceStats.reduce((a, b) => a + b.count, 0);
  const allowedCompliance = complianceStats.find((c) => c.result === "allowed")?.count ?? 0;
  const blockedCompliance = complianceStats.find((c) => c.result === "blocked")?.count ?? 0;

  const merchantRows: MerchantRow[] = merchantDetails.map((m) => ({
    name: m.name,
    wallet: m.wallet,
    chains: m.chains ?? "",
    txns: m.txns,
    volume: Number(m.volume),
    lastActive: m.lastActive,
    created: m.created?.toISOString() ?? "",
  }));

  const agentRows: AgentRow[] = agentDetails.map((a) => ({
    name: a.name,
    address: a.address,
    merchant: a.merchant ?? "(unknown)",
    txns: a.txns,
    volume: Number(a.volume),
    status: a.status,
    lastActive: a.lastActive,
  }));

  const endpointRows: EndpointRow[] = topEndpoints.map((e) => ({
    endpoint: e.endpoint ?? "(unknown)",
    volume: Number(e.volume),
    txns: e.txns,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">
        Business metrics across all merchants, agents, and transactions.
      </p>

      {/* A. Vanity Metrics */}
      <Section title="Vanity Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="GitHub Stars" value={github.stars} />
          <StatCard label="GitHub Forks" value={github.forks} />
          <StatCard label="npm Downloads (30d)" value={totalNpmDownloads.toLocaleString()} sub="All packages" />
          {NPM_PACKAGES.map((pkg) => (
            <StatCard
              key={pkg}
              label={`@pincerpay/${pkg}`}
              value={(npmDownloads[pkg] ?? 0).toLocaleString()}
              sub="30d downloads"
            />
          ))}
        </div>
      </Section>

      {/* B. Revenue & Volume */}
      <Section title="Revenue & Volume">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Revenue (1%)" value={fmt(totalRevenue * 1_000_000)} />
          <StatCard label="Monthly Run Rate" value={fmt(monthlyRunRate * 1_000_000)} sub="Extrapolated from 30d" />
          <StatCard label="All-time Volume" value={fmt(totalVolume)} />
          <StatCard label="30d Volume" value={fmt(volume30d)} />
          <StatCard label="7d Volume" value={fmt(stats7d.totalVolume)} />
          <StatCard label="24h Volume" value={fmt(stats24h.totalVolume)} />
          <StatCard label="All-time Txns" value={allTimeStats.totalTxns.toLocaleString()} />
          <StatCard label="30d Txns" value={stats30d.totalTxns.toLocaleString()} />
          <StatCard label="Avg Tx Size" value={fmt(avgTxSize)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Daily Volume & Revenue (90d)">
            {dailyTrend.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No data yet</p>
            ) : (
              <DailyTrendChart data={dailyTrend} />
            )}
          </ChartCard>
          <ChartCard title="Daily Transaction Count (90d)">
            {dailyTrend.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No data yet</p>
            ) : (
              <DailyTxCountChart data={dailyTrend} />
            )}
          </ChartCard>
          <ChartCard title="Volume by Chain">
            {volumeByChain.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No data yet</p>
            ) : (
              <VolumeByChainChart data={volumeByChain} />
            )}
          </ChartCard>
          <ChartCard title="Settlement Type Breakdown">
            {settlementBreakdown.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No data yet</p>
            ) : (
              <SettlementChart data={settlementBreakdown} />
            )}
          </ChartCard>
        </div>
      </Section>

      {/* C. Users & Adoption */}
      <Section title="Users & Adoption">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Merchants" value={merchantCounts.total} />
          <StatCard label="Active Merchants (30d)" value={merchantCounts.active30d} />
          <StatCard label="New Merchants (30d)" value={merchantCounts.new30d} />
          <StatCard label="Total Agents" value={agentCounts.total} />
          <StatCard label="Active Agents (30d)" value={agentCounts.active30d} />
        </div>

        <div className="mb-6">
          <ChartCard title="Cumulative Signups (90d)">
            <CumulativeSignupsChart data={signupData as { date: string; merchants: number; agents: number }[]} />
          </ChartCard>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Merchants</h3>
            <MerchantTable data={merchantRows} />
          </div>

          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Agents</h3>
            <AgentTable data={agentRows} />
          </div>
        </div>
      </Section>

      {/* D. Segmentation & Insights */}
      <Section title="Segmentation & Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Top Endpoints by Volume</h3>
            <EndpointTable data={endpointRows} />
          </div>

          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Chain Preference Distribution</h3>
            {chainPrefs.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No data</p>
            ) : (
              <div className="space-y-2">
                {chainPrefs.map((cp) => {
                  const total = chainPrefs.reduce((a, b) => a + b.count, 0);
                  const widthPct = total > 0 ? (cp.count / total) * 100 : 0;
                  return (
                    <div key={cp.chain}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-mono">{cp.chain}</span>
                        <span className="text-[var(--muted-foreground)]">{cp.count} merchants ({widthPct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded bg-[var(--muted)]">
                        <div className="h-2 rounded bg-[var(--primary)]" style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* E. Operational Health */}
      <Section title="Operational Health">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Confirmation Rate"
            value={pct(allTimeStats.confirmedTxns, allTimeStats.totalTxns)}
            sub={`${allTimeStats.confirmedTxns} / ${allTimeStats.totalTxns}`}
          />
          <StatCard
            label="Avg Confirm Time"
            value={`${Number(allTimeStats.avgConfirmTime).toFixed(1)}s`}
          />
          <StatCard
            label="Failed Txns"
            value={allTimeStats.failedTxns}
            sub={pct(allTimeStats.failedTxns, allTimeStats.totalTxns) + " rate"}
          />
          <StatCard
            label="Optimistic Finality Usage"
            value={pct(allTimeStats.optimisticTxns, allTimeStats.totalTxns)}
            sub={`${allTimeStats.optimisticTxns} txns`}
          />
          <StatCard
            label="Webhook Delivery Rate"
            value={pct(deliveredWebhooks, totalWebhooks)}
            sub={`${deliveredWebhooks} / ${totalWebhooks}`}
          />
          <StatCard
            label="Compliance: Allowed"
            value={allowedCompliance}
            sub={pct(allowedCompliance, totalCompliance)}
          />
          <StatCard
            label="Compliance: Blocked"
            value={blockedCompliance}
            sub={pct(blockedCompliance, totalCompliance)}
          />
          <StatCard
            label="Agent:Merchant Ratio"
            value={merchantCounts.total > 0 ? (agentCounts.total / merchantCounts.total).toFixed(1) : "0"}
            sub="Marketplace health"
          />
        </div>
      </Section>
    </div>
  );
}
