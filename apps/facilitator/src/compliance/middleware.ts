import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../env.js";
import type { ComplianceProvider } from "./types.js";

/**
 * Hono middleware that screens addresses against a ComplianceProvider
 * before settlement. Extracts `paymentRequirements.payTo` from the request
 * body and checks it. Returns HTTP 451 (Unavailable For Legal Reasons) if
 * the address is sanctioned.
 */
export function complianceMiddleware(
  provider: ComplianceProvider,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const logger = c.get("logger");

    if (!provider.isReady()) {
      logger.warn({ msg: "compliance_provider_not_ready", provider: provider.name });
      return next();
    }

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      // Let downstream handler deal with malformed body
      return next();
    }

    // Collect addresses to screen
    const addressesToScreen: string[] = [];

    // Screen merchant's payTo address
    const paymentRequirements = body.paymentRequirements as
      | { payTo?: string }
      | undefined;

    if (paymentRequirements?.payTo) {
      addressesToScreen.push(paymentRequirements.payTo);
    }

    // Try to extract payer/signer address from paymentPayload
    const paymentPayload = body.paymentPayload as Record<string, unknown> | undefined;
    if (paymentPayload) {
      // x402 V2: payload.payload.transaction may contain signer info
      // x402 EVM: payload may have "from" or signer address
      // For SVM: the first signer in the transaction is the payer
      // We extract what we can without fully decoding the transaction.
      const accepted = paymentPayload.accepted as Record<string, unknown> | undefined;
      if (accepted) {
        // V2 format: paymentPayload.accepted may contain payer info
        const payer = accepted.payer ?? accepted.from;
        if (typeof payer === "string") {
          addressesToScreen.push(payer);
        }
      }

      // Check for direct signer/from field
      const from = paymentPayload.from ?? paymentPayload.signer ?? paymentPayload.payer;
      if (typeof from === "string") {
        addressesToScreen.push(from);
      }
    }

    // Screen all collected addresses
    for (const address of addressesToScreen) {
      const result = await provider.check(address);

      logger.info({
        msg: "compliance_check",
        address,
        allowed: result.allowed,
        provider: provider.name,
        ...(result.matchedList && { matchedList: result.matchedList }),
      });

      if (!result.allowed) {
        logger.warn({
          msg: "compliance_blocked",
          address,
          reason: result.reason,
          matchedList: result.matchedList,
          matchedEntry: result.matchedEntry,
        });

        return c.json(
          {
            error: "Unavailable For Legal Reasons",
            code: "SANCTIONED_ADDRESS",
            message: result.reason ?? "Address is on a sanctions list",
          },
          451,
        );
      }
    }

    return next();
  };
}
