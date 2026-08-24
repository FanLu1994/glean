import { db } from "@/db";
import { dailyQuotes, generationLog } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { pickRandomSource } from "@/lib/sources";
import { generateQuote, validateQuote, fixQuote } from "@/lib/ai";
import {
  getRecentKeywords,
  isDuplicateQuote,
  hashQuote,
} from "@/lib/dedup";
import { sendDailyEmail } from "@/lib/email";

const MAX_ATTEMPTS = 5;
const COMMONNESS_RETRY_ATTEMPTS = 3;
const COMMONNESS_REJECT_THRESHOLD = 4;
const generationInFlight = new Set<string>();

type GenerateDailyQuoteResult =
  | { success: true; date: string; quote: string; source: string; attempt?: number; degraded?: boolean }
  | { success: false; date: string; error: string };

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function canGenerateDailyQuote() {
  return Boolean(
    process.env.DEEPSEEK_BASE_URL &&
      process.env.DEEPSEEK_API_KEY &&
      process.env.DEEPSEEK_API_KEY !== "sk-xxx"
  );
}

async function sendDailyEmailOnce(
  date: string,
  quote: Parameters<typeof sendDailyEmail>[0]
) {
  const [sent] = await db
    .select({ id: generationLog.id })
    .from(generationLog)
    .where(
      and(
        eq(generationLog.date, date),
        eq(generationLog.status, "daily_email_delivered")
      )
    )
    .limit(1);

  if (sent) return;

  const sentCount = await sendDailyEmail(quote);
  if (sentCount === 0) return;

  await db.insert(generationLog).values({
    date,
    status: "daily_email_delivered",
    attempt: 0,
  });
}

async function insertDailyQuote(
  date: string,
  quote: Awaited<ReturnType<typeof generateQuote>>
) {
  const inserted = await db
    .insert(dailyQuotes)
    .values({
      date,
      quoteZh: quote.quote_zh,
      quoteEn: quote.quote_en,
      pinyin: quote.pinyin,
      source: quote.source,
      author: quote.author,
      explanationZh: quote.explanation_zh,
      explanationEn: quote.explanation_en,
      scenarioZh: quote.scenario_zh,
      scenarioEn: quote.scenario_en,
      themeKeywords: quote.theme_keywords,
      rawAiResponse: quote as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: dailyQuotes.date })
    .returning({ id: dailyQuotes.id });

  return inserted.length > 0;
}

export async function generateDailyQuoteForDate(
  date = getTodayDate()
): Promise<GenerateDailyQuoteResult> {
  const [existing] = await db
    .select()
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, date))
    .limit(1);

  if (existing) {
    try {
      await sendDailyEmailOnce(date, {
        quote_zh: existing.quoteZh,
        quote_en: existing.quoteEn,
        pinyin: existing.pinyin,
        source: existing.source,
        author: existing.author,
        explanation_zh: existing.explanationZh,
        explanation_en: existing.explanationEn,
        scenario_zh: existing.scenarioZh,
        scenario_en: existing.scenarioEn,
      });
    } catch (error) {
      return {
        success: false,
        date,
        error: error instanceof Error ? error.message : "Failed to send daily email",
      };
    }

    return {
      success: true,
      date,
      quote: existing.quoteZh,
      source: existing.source,
    };
  }

  if (!canGenerateDailyQuote()) {
    return { success: false, date, error: "AI generation is not configured" };
  }

  const recentKeywords = await getRecentKeywords(90);
  let lastGenerated: Awaited<ReturnType<typeof generateQuote>> | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const selectedSource = pickRandomSource(new Set());

    if (!selectedSource) {
      return { success: false, date, error: "No sources available" };
    }

    try {
      const generated = await generateQuote({ source: selectedSource });
      lastGenerated = generated;

      if (await isDuplicateQuote(generated.quote_zh)) {
        await db.insert(generationLog).values({
          date,
          sourceTried: selectedSource,
          quoteHash: await hashQuote(generated.quote_zh),
          status: "rejected_duplicate",
          rejectReason: "Duplicate text detected",
          attempt,
        });
        continue;
      }

      const validation = await validateQuote(generated, recentKeywords);
      if (!validation.pass) {
        await db.insert(generationLog).values({
          date,
          sourceTried: selectedSource,
          quoteHash: await hashQuote(generated.quote_zh),
          status: "rejected_quality",
          rejectReason: validation.issues.join("; "),
          attempt,
        });
        continue;
      }

      if (
        attempt <= COMMONNESS_RETRY_ATTEMPTS &&
        (validation.commonness_score ?? 0) >= COMMONNESS_REJECT_THRESHOLD
      ) {
        await db.insert(generationLog).values({
          date,
          sourceTried: selectedSource,
          quoteHash: await hashQuote(generated.quote_zh),
          status: "rejected_quality",
          rejectReason:
            validation.commonness_reason ||
            `Quote commonness score ${validation.commonness_score}`,
          attempt,
        });
        continue;
      }

      const finalQuote =
        validation.fixes && Object.keys(validation.fixes).length > 0
          ? await fixQuote(generated, validation.fixes)
          : generated;

      const inserted = await insertDailyQuote(date, finalQuote);
      if (!inserted) {
        try {
          await sendDailyEmailOnce(date, finalQuote);
        } catch (error) {
          return {
            success: false,
            date,
            error:
              error instanceof Error ? error.message : "Failed to send daily email",
          };
        }

        return {
          success: true,
          date,
          quote: finalQuote.quote_zh,
          source: finalQuote.source,
          attempt,
        };
      }

      await db.insert(generationLog).values({
        date,
        sourceTried: selectedSource,
        quoteHash: await hashQuote(finalQuote.quote_zh),
        status: "success",
        attempt,
      });

      try {
        await sendDailyEmailOnce(date, finalQuote);
      } catch (error) {
        return {
          success: false,
          date,
          error: error instanceof Error ? error.message : "Failed to send daily email",
        };
      }

      return {
        success: true,
        date,
        quote: finalQuote.quote_zh,
        source: finalQuote.source,
        attempt,
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      await db.insert(generationLog).values({
        date,
        sourceTried: selectedSource,
        status: "rejected_quality",
        rejectReason: error instanceof Error ? error.message : "Unknown error",
        attempt,
      });
    }
  }

  if (lastGenerated) {
    console.warn(`All ${MAX_ATTEMPTS} attempts failed, using last generated result`);
    await insertDailyQuote(date, lastGenerated);

    try {
      await sendDailyEmailOnce(date, lastGenerated);
    } catch (error) {
      return {
        success: false,
        date,
        error: error instanceof Error ? error.message : "Failed to send daily email",
      };
    }

    return {
      success: true,
      date,
      quote: lastGenerated.quote_zh,
      source: lastGenerated.source,
      degraded: true,
    };
  }

  return {
    success: false,
    date,
    error: "Failed to generate quote after all attempts",
  };
}

export async function generateDailyQuoteOnce(date = getTodayDate()) {
  if (generationInFlight.has(date)) return;

  generationInFlight.add(date);
  try {
    const result = await generateDailyQuoteForDate(date);
    if (!result.success) {
      console.error(`Daily quote generation failed for ${date}: ${result.error}`);
    }
  } finally {
    generationInFlight.delete(date);
  }
}
