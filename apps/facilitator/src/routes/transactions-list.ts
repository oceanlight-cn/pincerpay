import { Hono } from "hono";
import type { Database } from "@pincerpay/db";
import { transactions } from "@pincerpay/db";
import { eq, and, count, desc } from "drizzle-orm";
import type { AppEnv } from "../env.js";
import { transactionFilterSchema } from "./schemas.js";

export function createTransactionListRoute(db: Database) {
  const app = new Hono<AppEnv>();

  app.get("/v1/transactions", async (c) => {
    const merchantId = c.get("merchantId");
    const query = transactionFilterSchema.safeParse(c.req.query());

    if (!query.success) {
      return c.json({ error: "Invalid query parameters", details: query.error.issues }, 400);
    }

    const { limit, offset, status, chain, from, to, agent } = query.data;
    const conditions = [eq(transactions.merchantId, merchantId)];

    if (status) conditions.push(eq(transactions.status, status));
    if (chain) conditions.push(eq(transactions.chainId, chain));
    if (from) conditions.push(eq(transactions.fromAddress, from));
    if (to) conditions.push(eq(transactions.toAddress, to));
    if (agent) conditions.push(eq(transactions.agentId, agent));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(where)
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(transactions)
        .where(where),
    ]);

    return c.json({ items, total, limit, offset });
  });

  return app;
}
