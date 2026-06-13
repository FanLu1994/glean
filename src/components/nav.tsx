// src/components/nav.tsx
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-8 flex items-center justify-between">
      <Link
        href="/"
        className="group flex items-baseline gap-3 text-base font-semibold tracking-[0.12em] hover:text-cinnabar"
      >
        <span>拾句</span>
        <span className="h-px w-7 bg-ink/20 group-hover:bg-cinnabar" />
        <span className="font-[family-name:var(--font-serif-en)] text-xs font-normal tracking-[0.28em] text-ink-light uppercase">
          Glean
        </span>
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/archive"
          className="px-2 py-2 text-ink-light hover:text-cinnabar"
        >
          归档
        </Link>
        <Link
          href="/subscribe"
          className="px-2 py-2 text-ink-light hover:text-cinnabar"
        >
          订阅
        </Link>
      </div>
    </nav>
  );
}
