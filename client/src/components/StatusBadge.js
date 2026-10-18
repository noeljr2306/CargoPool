const STYLES = {
  OPEN: "bg-cargo/15 text-cargo-dark",
  CLOSED: "bg-slate/15 text-slate",
  IN_TRANSIT: "bg-navy text-paper",
  DEPARTED: "bg-navy text-paper",
  CUSTOMS_CLEARED: "bg-sea/15 text-sea",
  ARRIVED: "bg-sea/15 text-sea",
  DELIVERED: "bg-sea text-white",
  PENDING: "border border-cargo/60 bg-white text-cargo-dark",
};

function humanize(value) {
  const text = value.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// One badge for container statuses, tracking milestones and "awaiting code".
export default function StatusBadge({ status, label }) {
  const style = STYLES[status] || "bg-slate/15 text-slate";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label || humanize(status)}
    </span>
  );
}
