// src/app/subscribe/page.tsx
import { SubscribeForm } from "./subscribe-form";

export default function SubscribePage() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-start">
      <section className="border-y border-ink/15 py-10 lg:py-16">
        <p className="text-xs tracking-[0.34em] text-cinnabar">SUBSCRIBE</p>
        <h1 className="mt-5 max-w-[10ch] text-5xl leading-tight md:text-7xl">
          每日一句，慢读入心
        </h1>
        <p className="mt-7 max-w-[58ch] text-base leading-8 text-ink-light">
          每天一条古文原句，配拼音、释义、英译和现代使用场景。邮件尽量克制，只把值得反复读的一句送到你面前。
        </p>
        <p className="mt-5 max-w-[58ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light">
          A daily classical Chinese sentence with pinyin, translation, and
          practical context.
        </p>
      </section>
      <section className="book-card bg-cream p-6 md:p-8 lg:mt-12">
        <SubscribeForm />
      </section>
    </div>
  );
}
