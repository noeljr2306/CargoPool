// Renders a short identifier (container ID, HS code, tracking code)
// in monospace so it's easy to scan and distinguish from prose.
export default function Code({ children }) {
  return <span className="font-mono text-sm text-slate">{children}</span>;
}
