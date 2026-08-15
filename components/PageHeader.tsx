export function PageHeader({
  eyebrow,
  title,
  caret = false,
  right,
  rightWide = false,
}: {
  eyebrow?: string;
  title: string;
  caret?: boolean;
  right?: React.ReactNode;
  /** Let the `right` widget stretch wide across the header whitespace as a
      short bar tucked top-right, instead of sitting compact against the edge. */
  rightWide?: boolean;
}) {
  // No descriptions under titles — Alex built it, he knows what it does.
  return (
    <header className={`mb-6 flex justify-between gap-4 ${rightWide ? 'items-start' : 'items-end'}`}>
      <div className="min-w-0 shrink-0">
        {eyebrow && (
          <div className="page-eyebrow mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-os-accent">
            <span>●</span> {eyebrow}
          </div>
        )}
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight text-os-text${caret ? ' caret-blink' : ''}`}>
          {title}
        </h1>
      </div>
      {right && (
        <div className={rightWide ? 'flex min-w-0 flex-1 items-start' : 'flex shrink-0 items-center gap-2'}>
          {right}
        </div>
      )}
    </header>
  );
}
