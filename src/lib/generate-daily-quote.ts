import { db } from "@/db";
import { dailyQuotes, generationLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pickRandomSource } from "@/lib/sources";
import { generateQuote, validateQuote, fixQuote } from "@/lib/ai";
import {
  getRecentSources,
  getRecentKeywords,
  isDuplicateQuote,
  hashQuote,
} from "@/lib/dedup";
import { sendDailyEmail } from "@/lib/email";

const MAX_ATTEMPTS = 5;
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
    .select({ id: dailyQuotes.id, quoteZh: dailyQuotes.quoteZh, source: dailyQuotes.source })
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, date))
    .limit(1);

  if (existing) {
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

  const recentSources = await getRecentSources(60);
  const recentKeywords = await getRecentKeywords(90);
  let lastGenerated: Awaited<ReturnType<typeof generateQuote>> | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let selectedSource = pickRandomSource(recentSources);
    if (!selectedSource) {
      selectedSource = pickRandomSource(await getRecentSources(30));
    }

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
        recentSources.add(selectedSource);
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
        recentSources.add(selectedSource);
        continue;
      }

      const finalQuote =
        validation.fixes && Object.keys(validation.fixes).length > 0
          ? await fixQuote(generated, validation.fixes)
          : generated;

      const inserted = await insertDailyQuote(date, finalQuote);
      if (!inserted) {
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

      sendDailyEmail(finalQuote).catch((err) =>
        console.error("Failed to send daily email:", err)
      );

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
    const inserted = await insertDailyQuote(date, lastGenerated);

    if (inserted) {
      sendDailyEmail(lastGenerated).catch((err) =>
        console.error("Failed to send daily email (degradation):", err)
      );
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
