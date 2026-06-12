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
      <div className="text-center py-20">
        <p className="text-ink-light">暂无归档内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-center tracking-wider">
        归档 · Archive
      </h1>

      {archive.map((group) => (
        <section key={group.month} className="space-y-3">
          <h2 className="text-sm font-semibold text-cinnabar tracking-wider pb-2 ink-border">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.quotes.map((q) => (
              <Link
                key={q.date}
                href={`/archive/${q.date}`}
                className="book-card block p-4 hover:bg-parchment/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="classical-text text-base truncate">
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
                  <span className="text-xs text-ink-light/60 whitespace-nowrap">
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
