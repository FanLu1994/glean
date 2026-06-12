// src/app/subscribe/verify/page.tsx
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-lg text-cinnabar">无效的验证链接</p>
        <p className="text-sm text-ink-light">Invalid verification link.</p>
      </div>
    );
  }

  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.verificationToken, token))
    .limit(1);

  if (!subscriber) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-lg text-cinnabar">验证链接已过期</p>
        <p className="text-sm text-ink-light">
          This verification link is invalid or has expired.
        </p>
      </div>
    );
  }

  if (subscriber.verified) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-lg">您已成功订阅！</p>
        <p className="text-sm text-ink-light">
          You&apos;re already subscribed!
        </p>
      </div>
    );
  }

  await db
    .update(subscribers)
    .set({ verified: true })
    .where(eq(subscribers.id, subscriber.id));

  return (
    <div className="text-center py-20 space-y-2">
      <p className="text-lg">🎉 订阅成功！</p>
      <p className="text-sm text-ink-light">
        Subscription confirmed! You&apos;ll receive daily quotes.
      </p>
    </div>
  );
}
