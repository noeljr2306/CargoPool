"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import Notice from "@/components/Notice";

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
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Notice>{error}</Notice>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-cargo-dark">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
