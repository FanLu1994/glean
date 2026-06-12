// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── daily_quotes ──────────────────────────────────────────────

export const dailyQuotes = pgTable(
  "daily_quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    quoteZh: text("quote_zh").notNull(),
    quoteEn: text("quote_en").notNull(),
    pinyin: text("pinyin").notNull(),
    source: text("source").notNull(),
    author: text("author").notNull(),
    explanationZh: text("explanation_zh").notNull(),
    explanationEn: text("explanation_en").notNull(),
    scenarioZh: text("scenario_zh").notNull(),
    scenarioEn: text("scenario_en").notNull(),
    themeKeywords: text("theme_keywords")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    rawAiResponse: jsonb("raw_ai_response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("daily_quotes_date_unique").on(table.date)]
);

// ── subscribers ───────────────────────────────────────────────

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    locale: text("locale").notNull().default("zh"),
    verified: boolean("verified").notNull().default(false),
    verificationToken: text("verification_token"),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("subscribers_email_unique").on(table.email)]
);

// ── generation_log ────────────────────────────────────────────

export const generationLog = pgTable(
  "generation_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    sourceTried: text("source_tried"),
    quoteHash: text("quote_hash"),
    status: text("status").notNull(),
    rejectReason: text("reject_reason"),
    attempt: integer("attempt").notNull(),
  },
  (table) => [index("generation_log_date_idx").on(table.date)]
);

// ── Type exports ──────────────────────────────────────────────

export type DailyQuote = typeof dailyQuotes.$inferSelect;
export type NewDailyQuote = typeof dailyQuotes.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type GenerationLogEntry = typeof generationLog.$inferSelect;
