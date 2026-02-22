"use server";

import { getDb } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { merchants, agents } from "@pincerpay/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getMerchantId(authUserId: string): Promise<string | null> {
  const db = getDb();
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.authUserId, authUserId))
    .limit(1);
  return merchant?.id ?? null;
}

/**
 * Validate that a spending limit value is a non-negative integer string (base units).
 * Returns null if valid, or an error message if invalid.
 */
function validateLimitValue(value: string | null, fieldName: string): string | null {
  if (value === null || value === "") return null;
  if (!/^\d+$/.test(value)) {
    return `${fieldName} must be a non-negative integer (base units)`;
  }
  return null;
}

export async function updateAgent(agentId: string, formData: FormData) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const merchantId = await getMerchantId(user.id);
  if (!merchantId) return { success: false, error: "No merchant profile" };

  const name = formData.get("name") as string;
  const status = formData.get("status") as string;

  // Parse limit fields: empty string or "clear" => null (remove limit)
  const rawMaxPerTx = formData.get("maxPerTransaction") as string | null;
  const rawMaxPerDay = formData.get("maxPerDay") as string | null;
  const maxPerTransaction = rawMaxPerTx === "clear" ? null : rawMaxPerTx || undefined;
  const maxPerDay = rawMaxPerDay === "clear" ? null : rawMaxPerDay || undefined;

  // Validate limit values
  if (maxPerTransaction !== undefined) {
    const err = validateLimitValue(maxPerTransaction, "Per-transaction limit");
    if (err) return { success: false, error: err };
  }
  if (maxPerDay !== undefined) {
    const err = validateLimitValue(maxPerDay, "Daily limit");
    if (err) return { success: false, error: err };
  }

  const db = getDb();

  // Build the update set, only including fields that were provided
  const updateSet: Record<string, unknown> = { updatedAt: new Date() };
  if (name) updateSet.name = name;
  if (status) updateSet.status = status;
  if (maxPerTransaction !== undefined) updateSet.maxPerTransaction = maxPerTransaction;
  if (maxPerDay !== undefined) updateSet.maxPerDay = maxPerDay;

  await db
    .update(agents)
    .set(updateSet)
    .where(and(eq(agents.id, agentId), eq(agents.merchantId, merchantId)));

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${agentId}`);
  return { success: true };
}

export async function deleteAgent(agentId: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const merchantId = await getMerchantId(user.id);
  if (!merchantId) return { success: false, error: "No merchant profile" };

  const db = getDb();
  await db
    .delete(agents)
    .where(and(eq(agents.id, agentId), eq(agents.merchantId, merchantId)));

  revalidatePath("/dashboard/agents");
  return { success: true };
}
