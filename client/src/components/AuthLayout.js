import ContainerMark from "./ContainerMark";

// Decorative stack of shipping containers, drawn from plain rectangles.
function ContainerStack() {
  const rows = [
    {
      y: 8,
      boxes: [
        { x: 60, w: 132 },
        { x: 196, w: 108, accent: true },
      ],
    },
    {
      y: 48,
      boxes: [
        { x: 20, w: 120 },
        { x: 144, w: 144 },
        { x: 292, w: 84 },
      ],
    },
    {
      y: 88,
      boxes: [
        { x: 0, w: 156 },
        { x: 160, w: 96 },
        { x: 260, w: 140 },
      ],
    },
  ];

  return (
    <svg viewBox="0 0 400 128" className="w-full max-w-sm" aria-hidden="true">
      {rows.map((row) =>
        row.boxes.map((b) => (
          <g key={`${row.y}-${b.x}`}>
            <rect
              x={b.x}
              y={row.y}
              width={b.w}
              height="34"
              rx="2"
              fill={b.accent ? "#E8873B" : "#1B2D47"}
              stroke="#F7F5F1"
              strokeOpacity="0.15"
            />
            {Array.from({ length: Math.floor((b.w - 12) / 12) }).map((_, i) => (
              <line
                key={i}
                x1={b.x + 10 + i * 12}
                x2={b.x + 10 + i * 12}
                y1={row.y + 5}
                y2={row.y + 29}
                stroke="#F7F5F1"
                strokeOpacity={b.accent ? 0.35 : 0.1}
              />
            ))}
          </g>
        )),
      )}
    </svg>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col justify-between bg-navy p-10 text-paper md:p-14">
        <div className="flex items-center gap-3">
          <ContainerMark className="h-9 w-9" />
          <span className="font-display text-xl font-semibold tracking-tight">
            CargoPool
          </span>
        </div>

        <div className="hidden md:block">
          <h1 className="mb-4 font-display text-4xl font-semibold leading-tight">
            Pool space.
            <br />
            Ship as one.
          </h1>
          <p className="mb-10 max-w-sm text-paper/70">
            Small shipments join a shared container, get classified for customs
            automatically, and travel under one manifest.
          </p>
          <ContainerStack />
        </div>

        <p className="hidden text-sm text-paper/40 md:block">
          Veritas University, Abuja — Final Year Project
        </p>
      </div>

      <div className="flex items-center justify-center p-8 md:p-14">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 font-display text-2xl font-semibold text-ink">
            {title}
          </h2>
          {subtitle && <p className="mb-8 text-slate">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
