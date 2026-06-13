// src/components/nav.tsx
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-8 flex items-center justify-between">
      <Link
        href="/"
        className="group flex items-baseline gap-2 text-xl font-semibold tracking-wide hover:text-cinnabar"
      >
        <span>拾句</span>
        <span className="h-px w-7 bg-ink/30 group-hover:bg-cinnabar" />
        <span className="text-ink-light font-normal text-sm tracking-[0.2em] uppercase">
          Glean
        </span>
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/archive"
          className="px-3 py-2 text-ink-light hover:text-cinnabar"
        >
          归档
        </Link>
        <Link
          href="/subscribe"
          className="border border-ink/15 bg-cream/60 px-4 py-2 text-ink hover:border-cinnabar/40 hover:text-cinnabar"
        >
          订阅
        </Link>
      </div>
    </nav>
  );
}
