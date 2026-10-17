"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/AuthLayout";

const DASHBOARD_BY_ROLE = {
  SHIPPER: "/dashboard/shipper",
  FORWARDER: "/dashboard/forwarder",
  CUSTOMS_AGENT: "/dashboard/customs",
  TRANSPORT_PERSONNEL: "/dashboard/transport",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      login(data.token, data.user);
      router.push(DASHBOARD_BY_ROLE[data.user.role] || "/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Log in" subtitle="Access your shipments and containers.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Email
          </label>
          <input
            type="email"
            className="w-full border border-slate/30 rounded px-3 py-2.5 bg-white text-ink focus-visible:border-cargo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Password
          </label>
          <input
            type="password"
            className="w-full border border-slate/30 rounded px-3 py-2.5 bg-white text-ink focus-visible:border-cargo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cargo hover:bg-cargo/90 text-white rounded py-2.5 font-medium transition-colors disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-sm text-slate mt-6">
        No account yet?{" "}
        <Link href="/register" className="text-cargo font-medium">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
