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
    <article className="mx-auto max-w-4xl space-y-20 lg:space-y-24">
      <header className="grid grid-cols-1 gap-7 border-t border-line/70 pt-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <p className="text-[0.7rem] tracking-[0.24em] text-cinnabar">
            今日拾句
          </p>
          <p className="text-2xl leading-tight md:text-3xl">
            {dateDisplayZh}
          </p>
        </div>
        <div className="space-y-1 text-left md:text-right">
          <p className="font-[family-name:var(--font-serif-en)] text-sm italic text-ink-light">
            {dateDisplayEn}
          </p>
          <p className="text-sm text-ink-light">
            {quote.source} <span className="mx-2 text-line">/</span>
            <span className="text-seal">{quote.author}</span>
          </p>
        </div>
      </header>

      <section className="py-10 md:py-20">
        <div className="mx-auto max-w-3xl px-0 text-center">
          <blockquote className="classical-text">{quote.quoteZh}</blockquote>
          <p className="pinyin-text mx-auto mt-10 max-w-2xl text-base leading-8">
            {quote.pinyin}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-14 border-t border-line/70 pt-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div className="space-y-5">
          <p className="text-sm tracking-[0.18em] text-cinnabar">
            释义
            <span className="ml-3 font-[family-name:var(--font-serif-en)] text-xs italic tracking-normal text-ink-light">
              Explanation
            </span>
          </p>
          <p className="max-w-[58ch] text-lg leading-9 md:text-xl">
            {quote.explanationZh}
          </p>
          <p className="max-w-[66ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light">
            {quote.explanationEn}
          </p>
        </div>
        <div className="space-y-5 lg:pt-12">
            <p className="text-sm tracking-[0.18em] text-cinnabar">
              使用场景
              <span className="ml-3 font-[family-name:var(--font-serif-en)] text-xs italic tracking-normal text-ink-light">
                Usage
              </span>
            </p>
            <p className="text-base leading-8">{quote.scenarioZh}</p>
            <p className="font-[family-name:var(--font-serif-en)] text-sm leading-7 text-ink-light">
              {quote.scenarioEn}
            </p>
        </div>
      </section>

      {showActions && (
        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-line/70 pt-8 text-sm sm:flex-row sm:items-center">
          {previousDate ? (
            <Link
              href={`/archive/${previousDate}`}
              className="px-1 py-3 text-center text-ink-light hover:text-cinnabar sm:text-left"
            >
              ← 昨天
            </Link>
          ) : (
            <span className="px-1 py-3 text-center text-ink-light/40">
              ← 昨天
            </span>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <ShareButton text={quote.quoteZh} />
            <Link
              href="/subscribe"
              className="border border-ink/15 bg-transparent px-6 py-3 text-center text-ink hover:border-cinnabar/35 hover:text-cinnabar"
            >
              订阅邮件
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
