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
    <article className="space-y-12 lg:space-y-16">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
        <aside className="order-2 flex flex-col justify-between border-y border-ink/15 py-7 lg:order-1 lg:min-h-[34rem]">
          <div className="space-y-8">
            <p className="text-xs tracking-[0.36em] text-cinnabar">
              DAILY CLASSICAL READING
            </p>
            <div className="space-y-3">
              <p className="text-3xl leading-tight md:text-5xl">
                {dateDisplayZh}
              </p>
              <p className="font-[family-name:var(--font-serif-en)] text-base italic text-ink-light">
                {dateDisplayEn}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 text-sm text-ink-light lg:grid-cols-1">
            <div className="space-y-1">
              <p className="text-[0.68rem] tracking-[0.28em] text-ink-light/70">
                SOURCE
              </p>
              <p className="text-ink">{quote.source}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[0.68rem] tracking-[0.28em] text-ink-light/70">
                AUTHOR
              </p>
              <span className="seal-stamp">{quote.author}</span>
            </div>
          </div>
        </aside>

        <div className="book-card order-1 relative overflow-hidden bg-cream px-6 py-10 text-center sm:px-10 md:py-16 lg:order-2 lg:px-16">
          <div className="pointer-events-none absolute inset-y-8 left-8 w-px bg-ink/10" />
          <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-ink/10" />
          <div className="pointer-events-none absolute inset-y-8 right-8 w-px bg-ink/10" />
          <div className="pointer-events-none absolute inset-x-8 bottom-8 h-px bg-ink/10" />

          <div className="relative mx-auto flex min-h-[24rem] max-w-4xl flex-col items-center justify-center gap-8">
            <blockquote className="classical-text">{quote.quoteZh}</blockquote>
            <div className="h-px w-28 bg-cinnabar/45" />
            <p className="pinyin-text max-w-3xl text-base leading-8 md:text-lg">
              {quote.pinyin}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 border-t border-ink/15 pt-7">
          <p className="text-xs font-semibold tracking-[0.32em] text-cinnabar">
            释义 · EXPLANATION
          </p>
          <p className="max-w-[56ch] text-xl leading-10 md:text-2xl">
            {quote.explanationZh}
          </p>
          <p className="max-w-[70ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light">
            {quote.explanationEn}
          </p>
        </div>
        <div className="book-card bg-rice p-6 md:p-8">
          <div className="space-y-5">
            <p className="text-xs font-semibold tracking-[0.32em] text-cinnabar">
              使用场景 · USAGE
            </p>
            <p className="text-base leading-8">{quote.scenarioZh}</p>
            <p className="font-[family-name:var(--font-serif-en)] text-sm leading-7 text-ink-light">
              {quote.scenarioEn}
            </p>
          </div>
        </div>
      </section>

      {showActions && (
        <div className="flex flex-col items-stretch justify-center gap-3 text-sm sm:flex-row sm:items-center">
          {previousDate ? (
            <Link
              href={`/archive/${previousDate}`}
              className="border border-transparent px-5 py-3 text-center text-ink-light hover:text-cinnabar"
            >
              ← 昨天
            </Link>
          ) : (
            <span className="px-5 py-3 text-center text-ink-light/40">
              ← 昨天
            </span>
          )}
          <ShareButton text={quote.quoteZh} />
          <Link
            href="/subscribe"
            className="bg-cinnabar px-6 py-3 text-center text-cream shadow-[0_18px_34px_-25px_rgba(184,71,63,0.75)] hover:bg-cinnabar-dark"
          >
            订阅邮件
          </Link>
        </div>
      )}
    </article>
  );
}
