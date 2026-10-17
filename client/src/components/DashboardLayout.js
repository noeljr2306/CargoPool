"use client";

import ContainerMark from "./ContainerMark";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-paper px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ContainerMark className="w-7 h-7" />
          <span className="font-display font-semibold text-lg">CargoPool</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-paper/70">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-paper/70 hover:text-cargo transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink mb-8">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
