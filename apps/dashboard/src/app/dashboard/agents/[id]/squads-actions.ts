"use server";

import { getDb } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { merchants, agents } from "@pincerpay/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  deriveSmartAccountPda,
  deriveSettingsPda,
  deriveSpendingLimitPda,
  checkSpendingLimit,
} from "@pincerpay/solana/squads";

async function getMerchantId(authUserId: string): Promise<string | null> {
  const db = getDb();
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.authUserId, authUserId))
    .limit(1);
  return merchant?.id ?? null;
}

async function getAuthedAgent(agentId: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const merchantId = await getMerchantId(user.id);
  if (!merchantId) return null;

  const db = getDb();
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.merchantId, merchantId)))
    .limit(1);

  return agent ?? null;
}

/**
 * Derive Smart Account PDAs for an agent.
 * Returns the data needed to construct a transaction on the client.
 */
export async function buildCreateSmartAccount(
  agentId: string,
  formData: FormData,
): Promise<{
  success: boolean;
  smartAccountPda?: string;
  settingsPda?: string;
  error?: string;
}> {
  const agent = await getAuthedAgent(agentId);
  if (!agent) return { success: false, error: "Agent not found" };

  const creator = formData.get("creator") as string;
  const accountIndex = parseInt(formData.get("accountIndex") as string ?? "0", 10);
  const threshold = parseInt(formData.get("threshold") as string ?? "1", 10);

  if (!creator) return { success: false, error: "Wallet not connected" };
  if (isNaN(accountIndex) || accountIndex < 0) return { success: false, error: "Invalid account index" };
  if (isNaN(threshold) || threshold < 1) return { success: false, error: "Threshold must be at least 1" };

  const [smartAccountPda] = await deriveSmartAccountPda(creator as never, accountIndex);
  const [settingsPda] = await deriveSettingsPda(smartAccountPda);

  return {
    success: true,
    smartAccountPda,
    settingsPda,
  };
}

/**
 * After a Smart Account creation transaction is confirmed on-chain,
 * persist the PDAs to the agent record.
 */
export async function confirmSmartAccountCreation(
  agentId: string,
  data: { smartAccountPda: string; settingsPda: string; txSignature: string },
): Promise<{ success: boolean; error?: string }> {
  const agent = await getAuthedAgent(agentId);
  if (!agent) return { success: false, error: "Agent not found" };

  const db = getDb();
  await db
    .update(agents)
    .set({
      smartAccountPda: data.smartAccountPda,
      settingsPda: data.settingsPda,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  revalidatePath(`/dashboard/agents/${agentId}`);
  revalidatePath("/dashboard/agents");
  return { success: true };
}

/**
 * Derive Spending Limit PDA for adding a limit on-chain.
 */
export async function buildAddSpendingLimit(
  agentId: string,
  formData: FormData,
): Promise<{
  success: boolean;
  spendingLimitPda?: string;
  spendingLimitIndex?: number;
  error?: string;
}> {
  const agent = await getAuthedAgent(agentId);
  if (!agent) return { success: false, error: "Agent not found" };
  if (!agent.smartAccountPda) return { success: false, error: "No Smart Account" };

  const indexStr = formData.get("spendingLimitIndex") as string ?? "0";
  const spendingLimitIndex = parseInt(indexStr, 10);
  if (isNaN(spendingLimitIndex) || spendingLimitIndex < 0) {
    return { success: false, error: "Invalid spending limit index" };
  }

  const [spendingLimitPda] = await deriveSpendingLimitPda(
    agent.smartAccountPda as never,
    spendingLimitIndex,
  );

  return {
    success: true,
    spendingLimitPda,
    spendingLimitIndex,
  };
}

/**
 * After a spending limit creation transaction is confirmed on-chain,
 * persist the PDA and index to the agent record.
 */
export async function confirmSpendingLimitCreation(
  agentId: string,
  data: { spendingLimitPda: string; spendingLimitIndex: number; txSignature: string },
): Promise<{ success: boolean; error?: string }> {
  const agent = await getAuthedAgent(agentId);
  if (!agent) return { success: false, error: "Agent not found" };

  const db = getDb();
  await db
    .update(agents)
    .set({
      spendingLimitPda: data.spendingLimitPda,
      spendingLimitIndex: data.spendingLimitIndex,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  revalidatePath(`/dashboard/agents/${agentId}`);
  revalidatePath("/dashboard/agents");
  return { success: true };
}

/**
 * Fetch on-chain spending limit state for display in the dashboard.
 */
export async function fetchSpendingLimitState(
  smartAccountPda: string,
  spendingLimitIndex: number,
): Promise<{
  exists: boolean;
  remainingAmount?: string;
  period?: number;
  lastReset?: string;
} | null> {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

  const result = await checkSpendingLimit(
    smartAccountPda as never,
    spendingLimitIndex,
    rpcUrl,
  );

  if (!result) return null;

  return {
    exists: result.exists,
    remainingAmount: result.remainingAmount?.toString(),
    period: result.period,
    lastReset: result.lastReset?.toString(),
  };
}
