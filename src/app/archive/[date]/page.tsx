// src/app/archive/[date]/page.tsx
import { db } from "@/db";
import { dailyQuotes } from "@/db/schema";
import { eq, desc, lt, gt } from "drizzle-orm";
import { QuoteCard } from "@/components/quote-card";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ date: string }>;
}

async function getQuoteByDate(date: string) {
  const [quote] = await db
    .select()
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, date))
    .limit(1);

  if (!quote) return { quote: null, prev: null, next: null };

  const [prev] = await db
    .select({ date: dailyQuotes.date })
    .from(dailyQuotes)
    .where(lt(dailyQuotes.date, date))
    .orderBy(desc(dailyQuotes.date))
    .limit(1);

  const [next] = await db
    .select({ date: dailyQuotes.date })
    .from(dailyQuotes)
    .where(gt(dailyQuotes.date, date))
    .orderBy(dailyQuotes.date)
    .limit(1);

  return { quote, prev: prev?.date ?? null, next: next?.date ?? null };
}

export default async function ArchiveDatePage({ params }: PageProps) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const { quote, prev, next } = await getQuoteByDate(date);

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-light/60">
        <Link href="/archive" className="hover:text-cinnabar transition-colors">
          归档
        </Link>
        <span className="mx-2">/</span>
        <span>{date}</span>
      </nav>

      <QuoteCard quote={quote} showActions={false} />

      <div className="flex justify-between text-sm">
        {prev ? (
          <Link
            href={`/archive/${prev}`}
            className="text-ink-light hover:text-cinnabar transition-colors"
          >
            ← 前一天
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/archive/${next}`}
            className="text-ink-light hover:text-cinnabar transition-colors"
          >
            后一天 →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
