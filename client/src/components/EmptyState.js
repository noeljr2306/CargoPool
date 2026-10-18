export default function EmptyState({ title, children }) {
  return (
    <div className="px-6 py-12 text-center">
      <svg
        viewBox="0 0 48 48"
        className="mx-auto mb-3 h-10 w-10 text-slate/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="6" y="20" width="36" height="18" rx="2" />
        <line x1="6" y1="28" x2="42" y2="28" />
        <rect x="14" y="8" width="20" height="12" rx="2" />
      </svg>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate">{children}</p>
      )}
    </div>
  );
}
