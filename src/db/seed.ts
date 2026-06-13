// src/db/seed.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });

const testQuotes: schema.NewDailyQuote[] = [
  {
    date: "2026-06-10",
    quoteZh: "学而不思则罔，思而不学则殆。",
    quoteEn:
      "Learning without thinking leads to confusion; thinking without learning ends in danger.",
    pinyin: "xué ér bù sī zé wǎng, sī ér bù xué zé dài.",
    source: "《论语·为政》",
    author: "孔子",
    explanationZh:
      "只学习却不思考就会迷惑而无所得，只思考却不学习就会精神疲倦而无所得。这句话强调了学习与思考必须结合，不可偏废。",
    explanationEn:
      "Studying without reflecting leads to bewilderment; reflecting without studying leads to exhaustion. Confucius emphasizes that learning and thinking must go hand in hand — neither alone suffices.",
    scenarioZh:
      "当你发现自己在不断读书、看视频学习，却感觉没有真正的收获时，这句话提醒你：停下来，好好思考所学的内容，将其内化为自己的见解。",
    scenarioEn:
      "When you find yourself consuming book after book and video after video but feeling no wiser, this quote reminds you to pause and think deeply about what you've learned.",
    themeKeywords: ["学习方法", "思考", "知行合一"],
  },
  {
    date: "2026-06-11",
    quoteZh: "知之为知之，不知为不知，是知也。",
    quoteEn:
      "To know what you know and what you don't know — that is true knowledge.",
    pinyin: "zhī zhī wéi zhī zhī, bù zhī wéi bù zhī, shì zhī yě.",
    source: "《论语·为政》",
    author: "孔子",
    explanationZh:
      "知道就是知道，不知道就是不知道，这样才是真正的智慧。这是一种求知的态度，强调对知识的诚实。",
    explanationEn:
      "Acknowledging what you know and admitting what you don't — that constitutes real wisdom. This reflects an honest attitude toward knowledge.",
    scenarioZh:
      "在工作会议中，当你被问到不熟悉的话题时，坦诚说'我不太了解'比不懂装懂更赢得尊重。",
    scenarioEn:
      "In a meeting, when asked about something unfamiliar, honestly saying 'I don't know much about that' earns more respect than bluffing.",
    themeKeywords: ["求知", "诚实", "谦逊"],
  },
  {
    date: "2026-06-12",
    quoteZh: "千里之行，始于足下。",
    quoteEn: "A journey of a thousand miles begins with a single step.",
    pinyin: "qiān lǐ zhī xíng, shǐ yú zú xià.",
    source: "《道德经·第六十四章》",
    author: "老子",
    explanationZh:
      "走一千里路，是从迈第一步开始的。比喻任何事情都要从最基础的地方做起，循序渐进，方能成就大业。",
    explanationEn:
      "A journey of a thousand miles starts from beneath one's feet. Great endeavors begin with the smallest first step — progress is made one action at a time.",
    scenarioZh:
      "当你面对一个庞大的人生目标感到无从下手时，记住：不需要一下子完成所有事情，迈出第一步就够了。",
    scenarioEn:
      "When facing an overwhelming goal, remember: you don't need to figure everything out at once. Just take the first step.",
    themeKeywords: ["行动", "坚持", "积累"],
  },
];

async function seed() {
  console.log("Seeding database...");

  for (const quote of testQuotes) {
    await db.insert(schema.dailyQuotes).values(quote).onConflictDoNothing();
    console.log(`  Inserted: ${quote.date} — ${quote.quoteZh.slice(0, 10)}...`);
  }

  console.log("Done!");
}

seed().catch(console.error);
