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
      <div className="mx-auto max-w-3xl border-t border-ink/15 py-24 text-center">
        <p className="text-xs tracking-[0.34em] text-cinnabar">ARCHIVE</p>
        <h1 className="mt-6 text-4xl">暂无归档内容</h1>
        <p className="mt-4 font-[family-name:var(--font-serif-en)] text-ink-light">
          Daily readings will appear here once generated.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-16">
      <header className="grid grid-cols-1 gap-8 border-t border-line/70 pt-8 md:grid-cols-[0.72fr_1.28fr] md:items-end">
        <div>
          <p className="text-[0.7rem] tracking-[0.24em] text-cinnabar">
            Archive
          </p>
          <h1 className="mt-4 text-4xl leading-tight md:text-5xl">归档</h1>
        </div>
        <p className="max-w-[54ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light md:justify-self-end">
          A quiet index of classical sentences, ordered by date for slow
          return visits.
        </p>
      </header>

      {archive.map((group) => (
        <section
          key={group.month}
          className="grid grid-cols-1 gap-6 md:grid-cols-[9rem_1fr]"
        >
          <h2 className="text-sm tracking-[0.14em] text-cinnabar">
            {group.label}
          </h2>
          <div className="divide-y divide-line/70 border-t border-line/70">
            {group.quotes.map((q) => (
              <Link
                key={q.date}
                href={`/archive/${q.date}`}
                className="group block py-6"
              >
                <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xl leading-relaxed tracking-[0.06em] group-hover:text-cinnabar md:text-2xl">
                      {q.quoteZh.split("，")[0]}
                      {q.quoteZh.includes("，") ? "，" : ""}
                      {q.quoteZh.split("，")[1]?.split("。")[0]
                        ? q.quoteZh.split("，")[1].split("。")[0] + "。"
                        : ""}
                    </p>
                    <p className="text-xs text-ink-light mt-1.5">
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
