// src/actions/subscribe.ts
"use server";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";

type SubscribeState = { error: string; success?: undefined } | { success: string; error?: undefined };

export async function subscribeAction(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = formData.get("email") as string;
  const locale = formData.get("locale") as string;

  if (!email || !email.includes("@")) {
    return { error: "请输入有效的邮箱地址 / Please enter a valid email." };
  }

  if (locale !== "zh" && locale !== "en") {
    return { error: "Invalid locale." };
  }

  try {
    const [existing] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (existing?.verified) {
      return { success: "您已订阅！ / You're already subscribed!" };
    }

    const token = crypto.randomUUID();

    if (existing) {
      await db
        .update(subscribers)
        .set({ verificationToken: token, locale, unsubscribedAt: null })
        .where(eq(subscribers.email, email));
    } else {
      await db.insert(subscribers).values({
        email,
        locale,
        verificationToken: token,
      });
    }

    await sendVerificationEmail(email, token, locale);
  } catch (e) {
    console.error("[subscribe] failed:", e);
    return { error: "邮件发送失败，请稍后重试 / Failed to send email. Try again later." };
  }

  return { success: "请检查邮箱确认订阅 / Check your email to confirm subscription!" };
}
