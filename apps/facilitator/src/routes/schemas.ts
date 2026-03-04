import { z } from "zod";

export const paymentRequestSchema = z.object({
  paymentPayload: z.record(z.unknown()),
  paymentRequirements: z.object({
    scheme: z.string(),
    network: z.string(),
    amount: z.union([z.string(), z.number()]),
    payTo: z.string(),
  }).passthrough(),
}).passthrough();

// ─── Pagination ───

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Paywall CRUD ───

export const createPaywallSchema = z.object({
  endpointPattern: z.string().min(1).describe('HTTP method + path, e.g. "GET /api/weather"'),
  amount: z.string().min(1).describe('USDC amount, e.g. "0.01"'),
  description: z.string().optional(),
  chains: z.array(z.string()).optional(),
});

export const updatePaywallSchema = z.object({
  amount: z.string().min(1).optional(),
  description: z.string().optional(),
  chains: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// ─── Transaction Filters ───

export const transactionFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
  chain: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  agent: z.string().optional(),
});

// ─── Agent Management ───

export const agentFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["active", "paused", "revoked"]).optional(),
  maxPerTransaction: z.string().optional(),
  maxPerDay: z.string().optional(),
});

// ─── Webhook Filters ───

export const webhookFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
  event: z.string().optional(),
});
