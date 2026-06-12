// src/components/quote-card.tsx
import type { DailyQuote } from "@/db/schema";
import Link from "next/link";
import { ShareButton } from "./share-button";

interface QuoteCardProps {
  quote: DailyQuote;
  showActions?: boolean;
  previousDate?: string | null;
}

export function QuoteCard({
  quote,
  showActions = true,
  previousDate,
}: QuoteCardProps) {
  const dateObj = new Date(quote.date + "T00:00:00");
  const dateDisplayZh = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  const dateDisplayEn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="space-y-8">
      {/* Date */}
      <p className="text-center text-ink-light text-sm tracking-wider">
        {dateDisplayZh} / {dateDisplayEn}
      </p>

      {/* Main quote block */}
      <div className="book-card p-8 md:p-12 text-center space-y-6">
        {/* Classical Chinese */}
        <blockquote className="classical-text">{quote.quoteZh}</blockquote>

        {/* Pinyin */}
        <p className="pinyin-text text-sm leading-relaxed">{quote.pinyin}</p>

        {/* Source attribution */}
        <p className="text-ink-light text-sm">
          ── {quote.source}{" "}
          <span className="seal-stamp ml-2">{quote.author}</span>
        </p>
      </div>

      {/* Explanation + Scenario cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="book-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-cinnabar tracking-wider">
            释义 · Explanation
          </h3>
          <p className="text-sm leading-relaxed">{quote.explanationZh}</p>
          <p className="text-sm leading-relaxed text-ink-light font-[family-name:var(--font-serif-en)]">
            {quote.explanationEn}
          </p>
        </div>
        <div className="book-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-cinnabar tracking-wider">
            使用场景 · Usage
          </h3>
          <p className="text-sm leading-relaxed">{quote.scenarioZh}</p>
          <p className="text-sm leading-relaxed text-ink-light font-[family-name:var(--font-serif-en)]">
            {quote.scenarioEn}
          </p>
        </div>
      </div>

      {/* Action bar */}
      {showActions && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {previousDate ? (
            <Link
              href={`/archive/${previousDate}`}
              className="text-ink-light hover:text-cinnabar transition-colors"
            >
              ← 昨天
            </Link>
          ) : (
            <span className="text-ink-light/40">← 昨天</span>
          )}
          <ShareButton text={quote.quoteZh} />
          <Link
            href="/subscribe"
            className="px-4 py-2 bg-cinnabar text-cream rounded hover:bg-cinnabar-dark transition-colors"
          >
            订阅邮件
          </Link>
        </div>
      )}
    </article>
  );
}
