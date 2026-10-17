// A simple geometric mark: two stacked shipping containers, built
// from plain rectangles — no icon library needed for one glyph.
export default function ContainerMark({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="14"
        width="24"
        height="10"
        rx="1"
        stroke="#E8873B"
        strokeWidth="2"
      />
      <line x1="4" y1="19" x2="28" y2="19" stroke="#E8873B" strokeWidth="1.5" />
      <rect
        x="9"
        y="6"
        width="14"
        height="8"
        rx="1"
        stroke="#F7F5F1"
        strokeWidth="2"
      />
      <line x1="9" y1="10" x2="23" y2="10" stroke="#F7F5F1" strokeWidth="1.5" />
    </svg>
  );
}
