"use server";

import { getDb } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { merchants, paywalls } from "@pincerpay/db";
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

export async function createPaywall(formData: FormData) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const merchantId = await getMerchantId(user.id);
  if (!merchantId) return { success: false, error: "No merchant profile" };

  const endpointPattern = formData.get("endpointPattern") as string;
  const amount = formData.get("amount") as string;
  const description = (formData.get("description") as string) || "";
  const chainsRaw = formData.get("chains") as string;
  const chains = chainsRaw ? chainsRaw.split(",").map((c) => c.trim()).filter(Boolean) : null;

  if (!endpointPattern || !amount) {
    return { success: false, error: "Endpoint pattern and amount are required" };
  }

  if (!/^\d+\.?\d*$/.test(amount)) {
    return { success: false, error: "Amount must be a valid number" };
  }

  const db = getDb();
  await db.insert(paywalls).values({
    merchantId,
    endpointPattern,
    amount,
    description,
    chains,
  });

  revalidatePath("/dashboard/paywalls");
  return { success: true };
}

export async function deletePaywall(paywallId: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const merchantId = await getMerchantId(user.id);
  if (!merchantId) return { success: false, error: "No merchant profile" };

  const db = getDb();
  await db
    .delete(paywalls)
    .where(and(eq(paywalls.id, paywallId), eq(paywalls.merchantId, merchantId)));

  revalidatePath("/dashboard/paywalls");
  return { success: true };
}

export async function togglePaywall(paywallId: string, isActive: boolean) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const merchantId = await getMerchantId(user.id);
  if (!merchantId) return { success: false, error: "No merchant profile" };

  const db = getDb();
  await db
    .update(paywalls)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(paywalls.id, paywallId), eq(paywalls.merchantId, merchantId)));

  revalidatePath("/dashboard/paywalls");
  return { success: true };
}
