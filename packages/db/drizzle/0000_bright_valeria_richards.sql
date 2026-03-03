CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"solana_address" text NOT NULL,
	"smart_account_pda" text,
	"settings_pda" text,
	"spending_limit_pda" text,
	"max_per_transaction" text,
	"max_per_day" text,
	"spending_limit_index" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"label" text DEFAULT 'Default' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "compliance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"result" text NOT NULL,
	"reason" text,
	"matched_list" text,
	"transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"supported_chains" text[] DEFAULT '{}' NOT NULL,
	"webhook_url" text,
	"auth_user_id" text NOT NULL,
	"on_chain_registered" boolean DEFAULT false NOT NULL,
	"merchant_pda" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "paywalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"endpoint_pattern" text NOT NULL,
	"amount" text NOT NULL,
	"chains" text[],
	"description" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"chain_id" text NOT NULL,
	"tx_hash" text NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"amount" text NOT NULL,
	"gas_cost" text DEFAULT '0' NOT NULL,
	"gas_token" text DEFAULT 'ETH' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"optimistic" boolean DEFAULT false NOT NULL,
	"slot" text,
	"priority_fee" text,
	"compute_units" text,
	"agent_id" uuid,
	"settlement_type" text DEFAULT 'x402' NOT NULL,
	"program_nonce" text,
	"endpoint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"transaction_id" uuid,
	"event" text NOT NULL,
	"url" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_code" integer,
	"last_error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_events" ADD CONSTRAINT "compliance_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paywalls" ADD CONSTRAINT "paywalls_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_merchant_id_idx" ON "agents" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "agents_solana_address_idx" ON "agents" USING btree ("solana_address");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_keys_merchant_id_idx" ON "api_keys" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "compliance_events_address_idx" ON "compliance_events" USING btree ("address");--> statement-breakpoint
CREATE INDEX "compliance_events_result_idx" ON "compliance_events" USING btree ("result");--> statement-breakpoint
CREATE INDEX "compliance_events_created_at_idx" ON "compliance_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "paywalls_merchant_id_idx" ON "paywalls" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paywalls_merchant_endpoint_uniq" ON "paywalls" USING btree ("merchant_id","endpoint_pattern");--> statement-breakpoint
CREATE INDEX "transactions_merchant_id_idx" ON "transactions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "transactions_tx_hash_idx" ON "transactions" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_merchant_chain_created_idx" ON "transactions" USING btree ("merchant_id","chain_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_merchant_id_idx" ON "webhook_deliveries" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_transaction_id_idx" ON "webhook_deliveries" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_next_retry_idx" ON "webhook_deliveries" USING btree ("status","next_retry_at");