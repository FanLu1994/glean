// src/components/quote-card.tsx
import type { DailyQuote } from "@/db/schema";
import type { CSSProperties } from "react";
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
  const quoteLength = Array.from(quote.quoteZh.replace(/\s/g, "")).length;
  const quoteStyle = {
    "--quote-scale": Math.max(0.62, Math.min(1, Math.sqrt(18 / quoteLength))),
  } as CSSProperties;

  return (
    <article className="mx-auto max-w-4xl space-y-14 lg:space-y-16">
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-0 text-center">
          <blockquote className="classical-text" style={quoteStyle}>
            {quote.quoteZh}
          </blockquote>
          <p className="pinyin-text mx-auto mt-10 max-w-2xl text-base leading-8">
            {quote.pinyin}
          </p>
          <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-2 text-xs leading-6 text-ink-light/65 sm:flex-row sm:justify-center sm:gap-4">
            <span className="tracking-[0.2em] text-ink-light/70">今日拾句</span>
            <time
              dateTime={quote.date}
              className="font-[family-name:var(--font-serif-en)] italic"
            >
              {dateDisplayEn}
            </time>
            <span>
              {dateDisplayZh}
              <span className="mx-2 text-line">/</span>
              {quote.source}
              <span className="mx-2 text-line">/</span>
              <span className="text-ink-light">{quote.author}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-12 pt-6">
        <div className="space-y-5">
          <p className="text-sm tracking-[0.16em] text-ink-light/70">
            释义
            <span className="ml-3 font-[family-name:var(--font-serif-en)] text-xs italic tracking-normal text-ink-light">
              Explanation
            </span>
          </p>
          <p className="text-lg leading-9 md:text-xl">
            {quote.explanationZh}
          </p>
          <p className="font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light/80">
            {quote.explanationEn}
          </p>
        </div>
        <div className="space-y-4 pt-4">
          <p className="text-sm tracking-[0.16em] text-ink-light/70">
            使用场景
            <span className="ml-3 font-[family-name:var(--font-serif-en)] text-xs italic tracking-normal text-ink-light">
              Usage
            </span>
          </p>
          <p className="text-base leading-8 text-ink/85">{quote.scenarioZh}</p>
          <p className="font-[family-name:var(--font-serif-en)] text-sm leading-7 text-ink-light/80">
            {quote.scenarioEn}
          </p>
        </div>
      </section>

      {showActions && (
        <div className="mx-auto flex max-w-3xl flex-col items-stretch justify-between gap-4 pt-4 text-sm sm:flex-row sm:items-center">
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
              className="px-1 py-3 text-center text-ink-light hover:text-ink"
            >
              订阅邮件
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
