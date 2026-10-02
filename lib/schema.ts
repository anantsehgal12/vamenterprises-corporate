export * from "@/src/db/schema";

// Kept for compatibility with the legacy quote-leads endpoint. The catalogue
// admin uses the current bulk_queries table through /api/admin/bulk_queries.
import { pgEnum, pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
const budgetPerPieceEnum = pgEnum("budget_per_piece", ["under_500", "501_1000", "1001_1500", "1501_2000", "2000_and_above"]);
const suitableHoursEnum = pgEnum("suitable_hours", ["9am_12pm", "12pm_3pm", "3pm_6pm", "6pm_9pm", "anytime"]);
const callStatusEnum = pgEnum("call_status", ["not_called", "called_no_response", "call_back_later", "interested", "not_interested", "converted", "invalid_number"]);
export const quoteLeads = pgTable("quote_leads", { id: serial("id").primaryKey(), customerName: varchar("customer_name", { length: 255 }).notNull(), companyName: varchar("company_name", { length: 255 }).notNull(), minOrderQty: integer("min_order_qty").notNull(), budgetPerPiece: budgetPerPieceEnum("budget_per_piece").notNull(), mobileNumber: varchar("mobile_number", { length: 15 }).notNull(), email: varchar("email", { length: 255 }), suitableHours: suitableHoursEnum("suitable_hours").notNull(), callStatus: callStatusEnum("call_status").notNull(), notes: text("notes"), createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull() });
