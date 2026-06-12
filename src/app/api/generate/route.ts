// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Check if today's quote already exists
  const [existing] = await db
    .select({ id: dailyQuotes.id })
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, today))
    .limit(1);

  if (existing) {
    return NextResponse.json({ message: "Today's quote already exists", date: today });
  }

  // Get recent data for dedup
  const recentSources = await getRecentSources(60);
  const recentKeywords = await getRecentKeywords(90);

  let lastGenerated: Awaited<ReturnType<typeof generateQuote>> | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Phase 1: Select source
      const source = pickRandomSource(recentSources);
      if (!source) {
        const expandedSources = await getRecentSources(30);
        const fallbackSource = pickRandomSource(expandedSources);
        if (!fallbackSource) {
          return NextResponse.json(
            { error: "No sources available" },
            { status: 500 }
          );
        }
      }

      const selectedSource = source ?? "论语";

      // Phase 2: Generate
      const generated = await generateQuote({ source: selectedSource });
      lastGenerated = generated;

      // Phase 3: Dedup + Validate
      const isDup = await isDuplicateQuote(generated.quote_zh);
      if (isDup) {
        await db.insert(generationLog).values({
          date: today,
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
          date: today,
          sourceTried: selectedSource,
          quoteHash: await hashQuote(generated.quote_zh),
          status: "rejected_quality",
          rejectReason: validation.issues.join("; "),
          attempt,
        });
        recentSources.add(selectedSource);
        continue;
      }

      // Phase 4: Fix minor issues
      let finalQuote = generated;
      if (validation.fixes && Object.keys(validation.fixes).length > 0) {
        finalQuote = await fixQuote(generated, validation.fixes);
      }

      // Phase 5: Store + Email
      const quoteHash = await hashQuote(finalQuote.quote_zh);

      await db.insert(dailyQuotes).values({
        date: today,
        quoteZh: finalQuote.quote_zh,
        quoteEn: finalQuote.quote_en,
        pinyin: finalQuote.pinyin,
        source: finalQuote.source,
        author: finalQuote.author,
        explanationZh: finalQuote.explanation_zh,
        explanationEn: finalQuote.explanation_en,
        scenarioZh: finalQuote.scenario_zh,
        scenarioEn: finalQuote.scenario_en,
        themeKeywords: finalQuote.theme_keywords,
        rawAiResponse: finalQuote as unknown as Record<string, unknown>,
      });

      await db.insert(generationLog).values({
        date: today,
        sourceTried: selectedSource,
        quoteHash,
        status: "success",
        attempt,
      });

      // Send daily email (non-blocking)
      sendDailyEmail(finalQuote).catch((err) =>
        console.error("Failed to send daily email:", err)
      );

      return NextResponse.json({
        success: true,
        date: today,
        quote: finalQuote.quote_zh,
        source: finalQuote.source,
        attempt,
      });
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      await db.insert(generationLog).values({
        date: today,
        sourceTried: "unknown",
        status: "rejected_quality",
        rejectReason: error instanceof Error ? error.message : "Unknown error",
        attempt,
      });
    }
  }

  // Degradation: use last generated result
  if (lastGenerated) {
    console.warn(`All ${MAX_ATTEMPTS} attempts failed, using last generated result`);

    await db.insert(dailyQuotes).values({
      date: today,
      quoteZh: lastGenerated.quote_zh,
      quoteEn: lastGenerated.quote_en,
      pinyin: lastGenerated.pinyin,
      source: lastGenerated.source,
      author: lastGenerated.author,
      explanationZh: lastGenerated.explanation_zh,
      explanationEn: lastGenerated.explanation_en,
      scenarioZh: lastGenerated.scenario_zh,
      scenarioEn: lastGenerated.scenario_en,
      themeKeywords: lastGenerated.theme_keywords,
      rawAiResponse: lastGenerated as unknown as Record<string, unknown>,
    });

    sendDailyEmail(lastGenerated).catch((err) =>
      console.error("Failed to send daily email (degradation):", err)
    );

    return NextResponse.json({
      success: true,
      date: today,
      quote: lastGenerated.quote_zh,
      degraded: true,
    });
  }

  return NextResponse.json(
    { error: "Failed to generate quote after all attempts" },
    { status: 500 }
  );
}
