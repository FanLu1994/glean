// src/app/subscribe/subscribe-form.tsx
"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/actions/subscribe";

export function SubscribeForm() {
  const [state, formAction, isPending] = useActionState(subscribeAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          className="w-full px-4 py-3 border border-ink/20 rounded bg-cream text-ink focus:outline-none focus:border-cinnabar transition-colors font-[family-name:var(--font-serif-en)]"
        />
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="locale"
            value="zh"
            defaultChecked
            className="accent-cinnabar"
          />
          <span className="text-sm">中文</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="locale"
            value="en"
            className="accent-cinnabar"
          />
          <span className="text-sm">English</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-cinnabar text-cream rounded hover:bg-cinnabar-dark transition-colors disabled:opacity-50"
      >
        {isPending ? "提交中..." : "订阅 · Subscribe"}
      </button>

      {state.error && (
        <p className="text-sm text-red-700 text-center">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-800 text-center">{state.success}</p>
      )}
    </form>
  );
}
