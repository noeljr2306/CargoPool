import StatusBadge from "./StatusBadge";
import Code from "./Code";

// Vertical scan history. `events` need { id, milestone, timestamp, detail? }.
export default function Timeline({
  events,
  newestFirst = false,
  emptyText = "No scan events yet.",
}) {
  if (!events.length) {
    return <p className="text-sm text-slate">{emptyText}</p>;
  }

  const latestIndex = newestFirst ? 0 : events.length - 1;

  return (
    <ol className="relative ml-2 border-l border-line">
      {events.map((ev, i) => (
        <li key={ev.id} className="relative mb-5 ml-5 last:mb-0">
          <span
            className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
              i === latestIndex ? "bg-cargo" : "bg-slate/40"
            }`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ev.milestone} />
            {ev.detail && <Code>{ev.detail}</Code>}
          </div>
          <p className="mt-1 text-xs text-slate">
            {new Date(ev.timestamp).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
