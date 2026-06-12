// src/lib/email.ts
import { Resend } from "resend";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface QuoteData {
  quote_zh: string;
  pinyin: string;
  quote_en: string;
  source: string;
  author: string;
  explanation_zh: string;
  explanation_en: string;
  scenario_zh: string;
  scenario_en: string;
}

function buildChineseEmailHtml(
  quote: QuoteData,
  token: string
): string {
  const date = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="max-width:600px;margin:0 auto;padding:24px;font-family:serif;background:#FFFDF7;color:#3C2415;">
  <div style="text-align:center;margin-bottom:24px;">
    <h2 style="color:#C53D43;font-size:14px;letter-spacing:4px;margin-bottom:4px;">拾句 · Glean</h2>
    <p style="color:#6B5344;font-size:12px;">${date}</p>
  </div>
  <div style="background:#FFFDF7;border:1px solid rgba(60,36,21,0.1);padding:32px;border-radius:4px;text-align:center;margin-bottom:24px;">
    <p style="font-size:24px;line-height:2;letter-spacing:0.1em;margin:0 0 16px 0;">${quote.quote_zh}</p>
    <p style="font-style:italic;color:#6B5344;font-size:13px;margin:0 0 12px 0;">${quote.pinyin}</p>
    <p style="color:#6B5344;font-size:13px;margin:0;">── ${quote.source} ${quote.author}</p>
  </div>
  <div style="margin-bottom:16px;">
    <h3 style="color:#C53D43;font-size:13px;margin-bottom:8px;">释义</h3>
    <p style="font-size:14px;line-height:1.8;margin:0;">${quote.explanation_zh}</p>
  </div>
  <div style="margin-bottom:24px;">
    <h3 style="color:#C53D43;font-size:13px;margin-bottom:8px;">使用场景</h3>
    <p style="font-size:14px;line-height:1.8;margin:0;">${quote.scenario_zh}</p>
  </div>
  <div style="text-align:center;border-top:1px solid rgba(60,36,21,0.1);padding-top:16px;">
    <a href="${BASE_URL}" style="color:#C53D43;text-decoration:none;font-size:13px;">查看完整内容</a>
    <span style="color:#6B5344;margin:0 8px;">·</span>
    <a href="${BASE_URL}/unsubscribe?token=${token}" style="color:#6B5344;text-decoration:none;font-size:12px;">退订</a>
  </div>
</body>
</html>`;
}

function buildEnglishEmailHtml(
  quote: QuoteData,
  token: string
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="max-width:600px;margin:0 auto;padding:24px;font-family:serif;background:#FFFDF7;color:#3C2415;">
  <div style="text-align:center;margin-bottom:24px;">
    <h2 style="color:#C53D43;font-size:14px;letter-spacing:4px;margin-bottom:4px;">Glean · 拾句</h2>
    <p style="color:#6B5344;font-size:12px;">${date}</p>
  </div>
  <div style="background:#FFFDF7;border:1px solid rgba(60,36,21,0.1);padding:32px;border-radius:4px;text-align:center;margin-bottom:24px;">
    <p style="font-size:24px;line-height:2;letter-spacing:0.1em;margin:0 0 16px 0;">${quote.quote_zh}</p>
    <p style="font-style:italic;color:#6B5344;font-size:13px;margin:0 0 8px 0;">${quote.pinyin}</p>
    <p style="font-size:15px;margin:0 0 12px 0;font-style:italic;">${quote.quote_en}</p>
    <p style="color:#6B5344;font-size:13px;margin:0;">── ${quote.source} ${quote.author}</p>
  </div>
  <div style="margin-bottom:16px;">
    <h3 style="color:#C53D43;font-size:13px;margin-bottom:8px;">Explanation</h3>
    <p style="font-size:14px;line-height:1.8;margin:0;">${quote.explanation_en}</p>
  </div>
  <div style="margin-bottom:24px;">
    <h3 style="color:#C53D43;font-size:13px;margin-bottom:8px;">Usage</h3>
    <p style="font-size:14px;line-height:1.8;margin:0;">${quote.scenario_en}</p>
  </div>
  <div style="text-align:center;border-top:1px solid rgba(60,36,21,0.1);padding-top:16px;">
    <a href="${BASE_URL}" style="color:#C53D43;text-decoration:none;font-size:13px;">View Full Page</a>
    <span style="color:#6B5344;margin:0 8px;">·</span>
    <a href="${BASE_URL}/unsubscribe?token=${token}" style="color:#6B5344;text-decoration:none;font-size:12px;">Unsubscribe</a>
  </div>
</body>
</html>`;
}

/** Send verification email to new subscriber */
export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: string
) {
  const verifyUrl = `${BASE_URL}/subscribe/verify?token=${token}`;

  await resend.emails.send({
    from: "拾句 Glean <glean@yourdomain.com>",
    to: email,
    subject:
      locale === "zh"
        ? "确认你的拾句订阅"
        : "Confirm your Glean subscription",
    html:
      locale === "zh"
        ? `<p>点击以下链接确认订阅拾句每日古文：</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
        : `<p>Click the link below to confirm your Glean subscription:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

/** Send daily quote to all verified subscribers */
export async function sendDailyEmail(quote: QuoteData) {
  const activeSubscribers = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.verified, true),
        isNull(subscribers.unsubscribedAt)
      )
    );

  if (activeSubscribers.length === 0) return;

  // Send individually so each gets their own unsubscribe link
  const results = await Promise.allSettled(
    activeSubscribers.map((sub) => {
      const token = sub.verificationToken ?? "";
      const html =
        sub.locale === "en"
          ? buildEnglishEmailHtml(quote, token)
          : buildChineseEmailHtml(quote, token);

      return resend.emails.send({
        from:
          sub.locale === "en"
            ? "Glean <glean@yourdomain.com>"
            : "拾句 <glean@yourdomain.com>",
        to: sub.email,
        subject:
          sub.locale === "en"
            ? `Daily Glean: ${quote.quote_en.slice(0, 50)}...`
            : `每日拾句：${quote.quote_zh.slice(0, 15)}...`,
        html,
      });
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(`Failed to send ${failures.length}/${results.length} emails`);
  }
}
