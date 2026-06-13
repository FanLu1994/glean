// src/app/archive/page.tsx
import { db } from "@/db";
import { dailyQuotes } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface GroupedQuotes {
  month: string;
  label: string;
  quotes: {
    date: string;
    quoteZh: string;
    source: string;
    author: string;
  }[];
}

async function getArchiveData(): Promise<GroupedQuotes[]> {
  const quotes = await db
    .select({
      date: dailyQuotes.date,
      quoteZh: dailyQuotes.quoteZh,
      source: dailyQuotes.source,
      author: dailyQuotes.author,
    })
    .from(dailyQuotes)
    .orderBy(desc(dailyQuotes.date));

  const groups = new Map<string, GroupedQuotes["quotes"]>();
  for (const q of quotes) {
    const month = q.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month)!.push(q);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, quotes]) => {
      const [y, m] = month.split("-");
      return {
        month,
        label: `${y}年${parseInt(m)}月`,
        quotes,
      };
    });
}

export default async function ArchivePage() {
  const archive = await getArchiveData();

  if (archive.length === 0) {
    return (
      <div className="mx-auto max-w-3xl border-y border-ink/15 py-20 text-center">
        <p className="text-xs tracking-[0.34em] text-cinnabar">ARCHIVE</p>
        <h1 className="mt-6 text-4xl">暂无归档内容</h1>
        <p className="mt-4 font-[family-name:var(--font-serif-en)] text-ink-light">
          Daily readings will appear here once generated.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="grid grid-cols-1 gap-6 border-y border-ink/15 py-10 md:grid-cols-[0.7fr_1.3fr] md:items-end">
        <div>
          <p className="text-xs tracking-[0.34em] text-cinnabar">ARCHIVE</p>
          <h1 className="mt-4 text-5xl leading-none md:text-7xl">归档</h1>
        </div>
        <p className="max-w-[58ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light md:justify-self-end">
          A quiet index of classical sentences, ordered by date for slow
          return visits.
        </p>
      </header>

      {archive.map((group) => (
        <section
          key={group.month}
          className="grid grid-cols-1 gap-5 md:grid-cols-[12rem_1fr]"
        >
          <h2 className="text-sm font-semibold tracking-[0.28em] text-cinnabar">
            {group.label}
          </h2>
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {group.quotes.map((q) => (
              <Link
                key={q.date}
                href={`/archive/${q.date}`}
                className="group block py-5 hover:bg-cream/45 md:px-5"
              >
                <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl leading-relaxed tracking-[0.08em] group-hover:text-cinnabar md:text-3xl">
                      {q.quoteZh.split("，")[0]}
                      {q.quoteZh.includes("，") ? "，" : ""}
                      {q.quoteZh.split("，")[1]?.split("。")[0]
                        ? q.quoteZh.split("，")[1].split("。")[0] + "。"
                        : ""}
                    </p>
                    <p className="text-xs text-ink-light mt-1">
                      {q.source} · {q.author}
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-serif-en)] text-sm italic text-ink-light/70 whitespace-nowrap">
                    {q.date.slice(5)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
