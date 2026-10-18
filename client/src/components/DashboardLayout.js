"use client";

import ContainerMark from "./ContainerMark";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const ROLE_LABELS = {
  SHIPPER: "Shipper",
  FORWARDER: "Forwarder",
  CUSTOMS_AGENT: "Customs agent",
  TRANSPORT_PERSONNEL: "Transport personnel",
};

// `nav` is a list of { label, href } anchors to sections on the page.
export default function DashboardLayout({
  title,
  subtitle,
  nav = [],
  children,
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="hidden flex-col bg-navy px-5 py-6 text-paper md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex items-center gap-3 px-2">
          <ContainerMark className="h-8 w-8" />
          <span className="font-display text-lg font-semibold">CargoPool</span>
        </div>

        <p className="mt-8 px-3 text-xs text-paper/50">
          {ROLE_LABELS[user?.role]}
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-paper/75 transition-colors hover:bg-navy-soft hover:text-paper"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto border-t border-paper/10 pt-4">
          <p className="truncate px-2 text-sm text-paper/80">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-md px-2 py-2 text-left text-sm text-paper/60 transition-colors hover:bg-navy-soft hover:text-cargo"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between bg-navy px-5 py-3 text-paper md:hidden">
          <div className="flex items-center gap-2">
            <ContainerMark className="h-7 w-7" />
            <span className="font-display font-semibold">CargoPool</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-paper/70 hover:text-cargo"
          >
            Log out
          </button>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-10">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
