// src/components/nav.tsx
import Link from "next/link";

export function Nav() {
  return (
    <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-7 text-sm sm:px-8 lg:px-10">
      <Link
        href="/"
        className="group flex items-baseline gap-3 font-semibold tracking-[0.16em] text-ink/80 hover:text-ink"
      >
        <span>拾句</span>
        <span className="font-[family-name:var(--font-serif-en)] text-[0.65rem] font-normal uppercase tracking-[0.24em] text-ink-light/70">
          Glean
        </span>
      </Link>
      <div className="flex items-center gap-4 text-xs text-ink-light/70">
        <Link
          href="/archive"
          className="py-2 hover:text-ink"
        >
          归档
        </Link>
        <Link
          href="/subscribe"
          className="py-2 hover:text-ink"
        >
          订阅
        </Link>
      </div>
    </nav>
  );
}
