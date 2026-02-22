import { type MiddlewareHandler } from "hono";
import { eq, and, gte, sql } from "drizzle-orm";
import type { Address } from "@solana/kit";
import type { Database } from "@pincerpay/db";
import { agents, transactions } from "@pincerpay/db";
import { checkSpendingLimit } from "@pincerpay/solana/squads";
import type { AppEnv } from "../env.js";

/**
 * Extract the fee payer (first account key) from a base64-encoded Solana
 * transaction. The fee payer is always the first pubkey in the message's
 * account keys array.
 *
 * Returns the base58-encoded public key, or null if parsing fails.
 */
function extractPayerFromSolanaTx(base64Tx: string): string | null {
  try {
    const buffer = Buffer.from(base64Tx, "base64");
    let offset = 0;

    // Read compact-u16 for signature count
    let sigCount = buffer[offset++];
    if (sigCount >= 0x80) {
      // Multi-byte compact-u16: low 7 bits + high bits in next byte
      sigCount = (sigCount & 0x7f) | (buffer[offset++] << 7);
    }

    // Skip signatures (each 64 bytes)
    offset += sigCount * 64;

    // Message header: 3 bytes
    //   numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts
    offset += 3;

    // Read compact-u16 for account count
    let accountCount = buffer[offset++];
    if (accountCount >= 0x80) {
      accountCount = (accountCount & 0x7f) | (buffer[offset++] << 7);
    }

    if (accountCount === 0 || offset + 32 > buffer.length) return null;

    // First 32 bytes after account count header = fee payer pubkey
    const payerBytes = buffer.subarray(offset, offset + 32);

    // Base58 encode
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = 0n;
    for (const byte of payerBytes) {
      num = num * 256n + BigInt(byte);
    }
    let result = "";
    while (num > 0n) {
      result = ALPHABET[Number(num % 58n)] + result;
      num = num / 58n;
    }
    // Leading zero bytes map to '1' in base58
    for (const byte of payerBytes) {
      if (byte === 0) result = "1" + result;
      else break;
    }
    return result || ALPHABET[0];
  } catch {
    return null;
  }
}

interface SquadsMiddlewareOptions {
  db: Database;
  rpcUrl: string;
}

/**
 * Squads SPN spending limit validation middleware.
 *
 * For Solana payments, extracts the fee payer from the transaction,
 * looks up the agent in the database, and validates:
 *   1. Agent status (revoked/paused agents are blocked)
 *   2. On-chain Squads spending limits (if the agent has a Smart Account)
 *
 * Non-Solana payments and unknown agents pass through (standard x402 flow).
 * On-chain lookup errors fail open to avoid blocking legitimate settlements.
 */
export function squadsMiddleware(
  options: SquadsMiddlewareOptions,
): MiddlewareHandler<AppEnv> {
  const { db, rpcUrl } = options;

  return async (c, next) => {
    const logger = c.get("logger");

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      // Malformed body will be caught by the route handler
      return next();
    }

    const paymentRequirements = body.paymentRequirements as
      | { network?: string; amount?: string }
      | undefined;

    if (!paymentRequirements) return next();

    // Squads is Solana-only
    const network = String(paymentRequirements.network ?? "");
    if (!network.startsWith("solana:")) return next();

    const merchantId = c.get("merchantId");
    if (!merchantId) return next();

    // Extract payer address from the SVM transaction
    const paymentPayload = body.paymentPayload as Record<string, unknown> | undefined;
    const txBase64 =
      (paymentPayload?.payload as Record<string, unknown> | undefined)?.transaction;
    if (!txBase64 || typeof txBase64 !== "string") return next();

    const payerAddress = extractPayerFromSolanaTx(txBase64);
    if (!payerAddress) return next();

    try {
      // Look up the agent by their Solana address and merchant
      const [agent] = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.solanaAddress, payerAddress),
            eq(agents.merchantId, merchantId),
          ),
        )
        .limit(1);

      // Unknown agent: no Squads enforcement, standard x402 flow
      if (!agent) return next();

      // Block revoked agents
      if (agent.status === "revoked") {
        logger.warn({
          msg: "squads_agent_revoked",
          agentId: agent.id,
          address: payerAddress,
        });
        return c.json(
          { error: "Agent access has been revoked", code: "AGENT_REVOKED" },
          403,
        );
      }

      // Block paused agents
      if (agent.status === "paused") {
        logger.warn({
          msg: "squads_agent_paused",
          agentId: agent.id,
          address: payerAddress,
        });
        return c.json(
          { error: "Agent access is paused", code: "AGENT_PAUSED" },
          403,
        );
      }

      // Parse requested amount (needed for all limit checks)
      const requestedAmount = paymentRequirements.amount
        ? BigInt(paymentRequirements.amount)
        : null;

      // App-level limits: enforced for ALL agents, regardless of Smart Account
      if (requestedAmount) {
        // Check per-transaction limit
        if (agent.maxPerTransaction) {
          const maxPerTx = BigInt(agent.maxPerTransaction);
          if (requestedAmount > maxPerTx) {
            logger.warn({
              msg: "per_tx_limit_exceeded",
              agentId: agent.id,
              address: payerAddress,
              maxPerTransaction: agent.maxPerTransaction,
              requested: requestedAmount.toString(),
            });
            return c.json(
              {
                error: "Per-transaction spending limit exceeded",
                code: "PER_TX_LIMIT_EXCEEDED",
                maxPerTransaction: agent.maxPerTransaction,
                requested: requestedAmount.toString(),
              },
              403,
            );
          }
        }

        // Check daily limit via DB query
        if (agent.maxPerDay) {
          const maxDaily = BigInt(agent.maxPerDay);
          const todayUtc = new Date();
          todayUtc.setUTCHours(0, 0, 0, 0);

          const [result] = await db
            .select({
              total: sql<string>`coalesce(sum(${transactions.amount}::numeric), 0)`,
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.agentId, agent.id),
                gte(transactions.createdAt, todayUtc),
              ),
            );

          const dailySpend = BigInt(result?.total ?? "0");
          if (dailySpend + requestedAmount > maxDaily) {
            logger.warn({
              msg: "daily_limit_exceeded",
              agentId: agent.id,
              address: payerAddress,
              maxPerDay: agent.maxPerDay,
              dailySpend: dailySpend.toString(),
              requested: requestedAmount.toString(),
            });
            return c.json(
              {
                error: "Daily spending limit exceeded",
                code: "DAILY_LIMIT_EXCEEDED",
                maxPerDay: agent.maxPerDay,
                dailySpend: dailySpend.toString(),
                requested: requestedAmount.toString(),
              },
              403,
            );
          }
        }
      }

      // On-chain Squads spending limit: only if agent has a Smart Account
      if (agent.smartAccountPda && requestedAmount) {
        try {
          const spendingLimitIndex = agent.spendingLimitIndex ?? 0;
          const limitState = await checkSpendingLimit(
            agent.smartAccountPda as Address,
            spendingLimitIndex,
            rpcUrl,
          );

          if (limitState?.exists && limitState.remainingAmount !== undefined) {
            if (limitState.remainingAmount < requestedAmount) {
              logger.warn({
                msg: "squads_spending_limit_exhausted",
                agentId: agent.id,
                address: payerAddress,
                remaining: limitState.remainingAmount.toString(),
                requested: requestedAmount.toString(),
              });
              return c.json(
                {
                  error: "Spending limit exhausted",
                  code: "SPENDING_LIMIT_EXHAUSTED",
                  remaining: limitState.remainingAmount.toString(),
                  requested: requestedAmount.toString(),
                },
                403,
              );
            }

            logger.info({
              msg: "squads_check_passed",
              agentId: agent.id,
              address: payerAddress,
              remaining: limitState.remainingAmount.toString(),
            });
          }
        } catch (err) {
          // Fail open on on-chain lookup errors
          logger.warn({
            msg: "squads_limit_check_error",
            agentId: agent.id,
            address: payerAddress,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      // Fail open on DB/unexpected errors
      logger.error({
        msg: "squads_middleware_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return next();
  };
}
