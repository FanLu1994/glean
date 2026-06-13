// src/components/footer.tsx
export function Footer() {
  return (
    <footer className="w-full max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-12 text-xs text-ink-light">
      <div className="mb-7 h-px bg-line/70" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} 拾句 · Glean</span>
        <span className="font-[family-name:var(--font-serif-en)] italic">
          One classical sentence, read slowly.
        </span>
      </div>
    </footer>
  );
}
