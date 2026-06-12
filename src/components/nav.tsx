// src/components/nav.tsx
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
      <Link
        href="/"
        className="text-lg font-semibold tracking-wide hover:text-cinnabar transition-colors"
      >
        拾句 <span className="text-ink-light font-normal">·</span>{" "}
        <span className="text-ink-light font-normal text-sm">Glean</span>
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link
          href="/archive"
          className="text-ink-light hover:text-cinnabar transition-colors"
        >
          归档
        </Link>
        <Link
          href="/subscribe"
          className="text-ink-light hover:text-cinnabar transition-colors"
        >
          订阅
        </Link>
      </div>
    </nav>
  );
}
