import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { transactions } from "./transactions.js";

export const complianceEvents = pgTable(
  "compliance_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The address that was screened */
    address: text("address").notNull(),
    /** allowed | blocked */
    result: text("result").notNull(),
    /** Human-readable reason */
    reason: text("reason"),
    /** Which sanctions list matched (e.g., "OFAC SDN") */
    matchedList: text("matched_list"),
    /** Transaction ID if screening was part of a settlement */
    transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("compliance_events_address_idx").on(table.address),
    index("compliance_events_result_idx").on(table.result),
    index("compliance_events_created_at_idx").on(table.createdAt),
  ],
);
