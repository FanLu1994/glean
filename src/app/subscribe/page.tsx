// src/app/subscribe/page.tsx
import { SubscribeForm } from "./subscribe-form";

export default function SubscribePage() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <section className="border-t border-line/70 pt-8 lg:pt-10">
        <p className="text-[0.7rem] tracking-[0.24em] text-cinnabar">
          Subscribe
        </p>
        <h1 className="mt-5 max-w-[11ch] text-4xl leading-tight md:text-5xl">
          每日一句，慢读入心
        </h1>
        <p className="mt-5 max-w-[58ch] font-[family-name:var(--font-serif-en)] text-base leading-8 text-ink-light">
          A daily classical Chinese sentence with pinyin, translation, and
          practical context.
        </p>
      </section>
      <section className="border-t border-line/70 pt-8 lg:mt-10">
        <SubscribeForm />
      </section>
    </div>
  );
}
