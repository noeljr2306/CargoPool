// Container fill bar. Turns orange when the container is nearly full.
export default function FillMeter({ percent, label }) {
  const safe = Math.max(0, Math.min(100, percent || 0));
  const color = safe >= 90 ? "bg-cargo" : "bg-sea";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate">
        <span>{label || "Filled"}</span>
        <span className="font-medium text-ink">{safe}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-paper ring-1 ring-line"
      >
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
