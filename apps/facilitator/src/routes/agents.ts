import { Hono } from "hono";
import type { Database } from "@pincerpay/db";
import { agents } from "@pincerpay/db";
import { eq, and, count, desc } from "drizzle-orm";
import type { AppEnv } from "../env.js";
import { agentFilterSchema, updateAgentSchema } from "./schemas.js";

export function createAgentRoutes(db: Database) {
  const app = new Hono<AppEnv>();

  // List agents
  app.get("/v1/agents", async (c) => {
    const merchantId = c.get("merchantId");
    const query = agentFilterSchema.safeParse(c.req.query());

    if (!query.success) {
      return c.json({ error: "Invalid query parameters", details: query.error.issues }, 400);
    }

    const { limit, offset, status } = query.data;
    const conditions = [eq(agents.merchantId, merchantId)];
    if (status) conditions.push(eq(agents.status, status));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(agents)
        .where(where)
        .orderBy(desc(agents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(agents)
        .where(where),
    ]);

    return c.json({ items, total, limit, offset });
  });

  // Update agent
  app.put("/v1/agents/:id", async (c) => {
    const merchantId = c.get("merchantId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid request body", details: parsed.error.issues }, 400);
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    for (const key of Object.keys(updates)) {
      if (updates[key] === undefined) delete updates[key];
    }

    const [updated] = await db
      .update(agents)
      .set(updates)
      .where(and(eq(agents.id, id), eq(agents.merchantId, merchantId)))
      .returning();

    if (!updated) {
      return c.json({ error: "Agent not found" }, 404);
    }

    return c.json(updated);
  });

  return app;
}
