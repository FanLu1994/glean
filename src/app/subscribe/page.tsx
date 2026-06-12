// src/app/subscribe/page.tsx
import { SubscribeForm } from "./subscribe-form";

export default function SubscribePage() {
  return (
    <div className="max-w-md mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-wider">订阅 · Subscribe</h1>
        <p className="text-sm text-ink-light">
          每日一句古文，直达你的邮箱
          <br />
          A daily classical Chinese quote delivered to your inbox.
        </p>
      </div>
      <SubscribeForm />
    </div>
  );
}
