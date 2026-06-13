// src/app/page.tsx
import { db } from "@/db";
import { dailyQuotes } from "@/db/schema";
import { desc, eq, lt } from "drizzle-orm";
import { QuoteCard } from "@/components/quote-card";
import { after } from "next/server";
import {
  canGenerateDailyQuote,
  generateDailyQuoteOnce,
} from "@/lib/generate-daily-quote";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // revalidate every hour

async function getTodayQuote() {
  const today = new Date().toISOString().slice(0, 10);

  // Try to get today's quote
  const [todays] = await db
    .select()
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, today))
    .limit(1);

  if (todays) {
    // Get previous day for navigation
    const [prev] = await db
      .select({ date: dailyQuotes.date })
      .from(dailyQuotes)
      .where(lt(dailyQuotes.date, today))
      .orderBy(desc(dailyQuotes.date))
      .limit(1);

    return {
      quote: todays,
      previousDate: prev?.date ?? null,
      isToday: true,
      today,
    };
  }

  // Fallback: get the most recent quote
  const [latest] = await db
    .select()
    .from(dailyQuotes)
    .orderBy(desc(dailyQuotes.date))
    .limit(1);

  if (!latest) {
    return { quote: null, previousDate: null, isToday: false, today };
  }

  const [prev] = await db
    .select({ date: dailyQuotes.date })
    .from(dailyQuotes)
    .where(lt(dailyQuotes.date, latest.date))
    .orderBy(desc(dailyQuotes.date))
    .limit(1);

  return {
    quote: latest,
    previousDate: prev?.date ?? null,
    isToday: false,
    today,
  };
}

export default async function HomePage() {
  const { quote, previousDate, isToday, today } = await getTodayQuote();
  const canAutoGenerate = canGenerateDailyQuote();

  if (!isToday && canAutoGenerate) {
    after(() => generateDailyQuoteOnce(today));
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-3xl border-y border-ink/15 py-20 text-center">
        <p className="text-xs tracking-[0.34em] text-cinnabar">
          DAILY READING
        </p>
        <h1 className="mt-6 text-4xl leading-tight md:text-6xl">
          {canAutoGenerate ? "今日拾句正在生成" : "今日拾句尚未生成"}
        </h1>
        <p className="mx-auto mt-6 max-w-[54ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light">
          {canAutoGenerate
            ? "Today's quote is being prepared. Please refresh in a moment."
            : "Daily generation is not configured yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isToday && (
        <div className="mx-auto max-w-3xl border-y border-ink/15 px-4 py-4 text-center text-sm leading-7 text-ink-light">
          {canAutoGenerate
            ? "今日拾句正在生成，先为你展示最近一期。"
            : "今日拾句尚未生成，先为你展示最近一期。"}
          <br />
          {canAutoGenerate
            ? "Today's quote is being prepared; here is the latest available entry."
            : "Daily generation is not configured yet; here is the latest available entry."}
        </div>
      )}
      <QuoteCard quote={quote} previousDate={previousDate} />
    </div>
  );
}
