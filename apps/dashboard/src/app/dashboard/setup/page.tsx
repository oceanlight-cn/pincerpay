import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { merchants, apiKeys, paywalls } from "@pincerpay/db";
import { eq, sql } from "drizzle-orm";
import { SetupWizard } from "./setup-wizard";

export default async function SetupPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = getDb();

  // Load merchant
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.authUserId, user.id))
    .limit(1);

  let initialStep = 1;

  if (merchant) {
    // Check counts
    const [[keyCount], [paywallCount]] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeys)
        .where(eq(apiKeys.merchantId, merchant.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(paywalls)
        .where(eq(paywalls.merchantId, merchant.id)),
    ]);

    if (keyCount.count > 0 && paywallCount.count > 0) {
      redirect("/dashboard");
    } else if (keyCount.count > 0) {
      initialStep = 3;
    } else {
      initialStep = 2;
    }
  }

  const userName = user.user_metadata?.name || "";

  return (
    <div>
      <SetupWizard
        initialStep={initialStep}
        userName={userName}
        existingMerchant={
          merchant
            ? {
                walletAddress: merchant.walletAddress,
                supportedChains: merchant.supportedChains,
              }
            : null
        }
      />
    </div>
  );
}
