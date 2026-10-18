export default function StatCard({ label, value, hint }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-slate">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate">{hint}</p>}
    </div>
  );
}
