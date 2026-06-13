// src/app/subscribe/subscribe-form.tsx
"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/actions/subscribe";

type SubscribeState =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined };

export function SubscribeForm() {
  const [state, formAction, isPending] = useActionState<
    SubscribeState,
    FormData
  >(subscribeAction, {} as SubscribeState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-ink">
          邮箱 · Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          className="w-full border border-line/80 bg-transparent px-4 py-4 font-[family-name:var(--font-serif-en)] text-ink outline-none focus:border-cinnabar"
        />
        <p className="text-xs leading-6 text-ink-light">
          仅用于每日拾句和订阅确认，不发送营销邮件。
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-ink">语言 · Language</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 border border-line/80 bg-transparent px-4 py-3">
            <input
              type="radio"
              name="locale"
              value="zh"
              defaultChecked
              className="accent-cinnabar"
            />
            <span className="text-sm">中文</span>
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 border border-line/80 bg-transparent px-4 py-3">
            <input
              type="radio"
              name="locale"
              value="en"
              className="accent-cinnabar"
            />
            <span className="text-sm">English</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full border border-ink/15 bg-transparent px-5 py-4 text-ink hover:border-cinnabar/35 hover:text-cinnabar disabled:opacity-50"
      >
        {isPending ? "提交中..." : "订阅 · Subscribe"}
      </button>

      {state.error && (
        <p className="border border-cinnabar/30 bg-cinnabar/5 px-4 py-3 text-sm leading-6 text-cinnabar-dark">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="border border-line bg-cream/55 px-4 py-3 text-sm leading-6 text-ink-light">
          {state.success}
        </p>
      )}
    </form>
  );
}
