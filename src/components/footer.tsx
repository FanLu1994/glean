// src/components/footer.tsx
export function Footer() {
  return (
    <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 text-xs text-ink-light">
      <div className="editorial-rule mb-6" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} 拾句 · Glean</span>
        <span className="font-[family-name:var(--font-serif-en)] italic">
          One classical sentence, read slowly.
        </span>
      </div>
    </footer>
  );
}
