// src/app/unsubscribe/page.tsx
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-lg text-cinnabar">无效的链接</p>
        <p className="text-sm text-ink-light">Invalid link.</p>
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
        <p className="text-lg text-cinnabar">链接无效或已过期</p>
        <p className="text-sm text-ink-light">
          This link is invalid or has expired.
        </p>
      </div>
    );
  }

  if (subscriber.unsubscribedAt) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-lg">您已退订</p>
        <p className="text-sm text-ink-light">
          You&apos;ve already unsubscribed.
        </p>
      </div>
    );
  }

  await db
    .update(subscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(subscribers.id, subscriber.id));

  return (
    <div className="text-center py-20 space-y-4">
      <p className="text-lg">已退订 · Unsubscribed</p>
      <p className="text-sm text-ink-light">
        你将不再收到每日邮件。感谢你的关注！
        <br />
        You will no longer receive daily emails. Thanks for being with us!
      </p>
    </div>
  );
}
