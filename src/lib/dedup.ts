// src/lib/dedup.ts
import { db } from "@/db";
import { dailyQuotes, generationLog } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

/** Get sources used in the last N days */
export async function getRecentSources(
  days: number
): Promise<Set<string>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select({ source: dailyQuotes.source })
    .from(dailyQuotes)
    .where(gte(dailyQuotes.date, cutoffStr));

  const sources = new Set<string>();
  for (const row of rows) {
    const match = row.source.match(/《([^·》]+)/);
    if (match) sources.add(match[1]);
  }
  return sources;
}

/** Get theme keywords from the last N days */
export async function getRecentKeywords(
  days: number
): Promise<string[][]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select({ keywords: dailyQuotes.themeKeywords })
    .from(dailyQuotes)
    .where(gte(dailyQuotes.date, cutoffStr));

  return rows.map((r) => r.keywords);
}

/** Check text-level dedup: hash + substring match */
export async function isDuplicateQuote(quoteZh: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(quoteZh)
  );
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const [existing] = await db
    .select({ id: generationLog.id })
    .from(generationLog)
    .where(sql`${generationLog.quoteHash} = ${hash}`)
    .limit(1);

  if (existing) return true;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentQuotes = await db
    .select({ quoteZh: dailyQuotes.quoteZh })
    .from(dailyQuotes)
    .where(gte(dailyQuotes.date, cutoffStr));

  for (const q of recentQuotes) {
    if (
      quoteZh.includes(q.quoteZh) ||
      q.quoteZh.includes(quoteZh)
    ) {
      return true;
    }
  }

  return false;
}

/** Compute SHA-256 hash of a string */
export async function hashQuote(quoteZh: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(quoteZh)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
