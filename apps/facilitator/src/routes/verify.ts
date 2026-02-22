import { Hono } from "hono";
import type { x402Facilitator } from "@x402/core/facilitator";
import type { AppEnv } from "../env.js";
import type { Metrics } from "../metrics.js";
import { paymentRequestSchema } from "./schemas.js";

interface VerifyRouteOptions {
  metrics?: Metrics;
}

export function createVerifyRoute(facilitator: x402Facilitator, options?: VerifyRouteOptions) {
  const app = new Hono<AppEnv>();

  app.post("/v1/verify", async (c) => {
    const logger = c.get("logger");
    const requestId = c.get("requestId");

    try {
      const body = await c.req.json();
      const parsed = paymentRequestSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: "Invalid request body", details: parsed.error.issues },
          400,
        );
      }

      // Use the original body for x402 (preserves full types), Zod just validates structure
      const { paymentPayload, paymentRequirements } = body;

      logger.info({
        msg: "verify_request",
        requestId,
        network: paymentRequirements.network,
        scheme: paymentRequirements.scheme,
        amount: paymentRequirements.amount,
      });

      const verifyStart = performance.now();
      const result = await facilitator.verify(
        paymentPayload,
        paymentRequirements,
      );
      const verifyDurationMs = Math.round(performance.now() - verifyStart);

      options?.metrics?.recordVerify(result.isValid, verifyDurationMs);

      logger.info({
        msg: "verify_result",
        requestId,
        isValid: result.isValid,
        payer: result.payer,
        durationMs: verifyDurationMs,
      });

      return c.json(result);
    } catch (error) {
      options?.metrics?.recordError("/v1/verify");
      logger.error({
        msg: "verify_error",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return c.json(
        {
          isValid: false,
          invalidReason: "INTERNAL_ERROR",
          invalidMessage: "Verification failed due to an internal error",
        },
        500,
      );
    }
  });

  return app;
}
