import ContainerMark from "./ContainerMark";

// Shared shell for /login and /register: a dark brand panel on the
// left, the form on paper background on the right. Stacks on mobile.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-navy text-paper flex flex-col justify-between p-10 md:p-14">
        <div className="flex items-center gap-3">
          <ContainerMark className="w-9 h-9" />
          <span className="font-display font-semibold text-xl tracking-tight">
            CargoPool
          </span>
        </div>

        <div className="hidden md:block">
          <h1 className="font-display text-4xl font-semibold leading-tight mb-4">
            Pool space.
            <br />
            Ship as one.
          </h1>
          <p className="text-paper/70 max-w-sm">
            Small shipments join a shared container, get classified for customs
            automatically, and travel under one manifest.
          </p>
        </div>

        <p className="text-paper/40 text-sm hidden md:block">
          Veritas University, Abuja — Final Year Project
        </p>
      </div>

      <div className="flex items-center justify-center p-8 md:p-14">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-semibold text-ink mb-1">
            {title}
          </h2>
          {subtitle && <p className="text-slate mb-8">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
