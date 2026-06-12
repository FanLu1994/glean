// src/app/page.tsx
import { db } from "@/db";
import { dailyQuotes } from "@/db/schema";
import { desc, eq, lt } from "drizzle-orm";
import { QuoteCard } from "@/components/quote-card";

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

    return { quote: todays, previousDate: prev?.date ?? null };
  }

  // Fallback: get the most recent quote
  const [latest] = await db
    .select()
    .from(dailyQuotes)
    .orderBy(desc(dailyQuotes.date))
    .limit(1);

  if (!latest) {
    return { quote: null, previousDate: null };
  }

  const [prev] = await db
    .select({ date: dailyQuotes.date })
    .from(dailyQuotes)
    .where(lt(dailyQuotes.date, latest.date))
    .orderBy(desc(dailyQuotes.date))
    .limit(1);

  return { quote: latest, previousDate: prev?.date ?? null };
}

export default async function HomePage() {
  const { quote, previousDate } = await getTodayQuote();

  if (!quote) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-xl text-ink-light">今日拾句尚未生成</p>
        <p className="text-sm text-ink-light/60">
          Today&apos;s quote has not been generated yet.
        </p>
      </div>
    );
  }

  return (
    <QuoteCard quote={quote} previousDate={previousDate} />
  );
}
