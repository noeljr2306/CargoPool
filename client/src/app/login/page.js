"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiRequest from "@/lib/api";
import useWarmup from "@/lib/useWarmup";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import Notice from "@/components/Notice";
import PasswordInput from "@/components/PasswordInput";

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
  const [slow, setSlow] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useWarmup();

  // Start loading the dashboards while the user types.
  useEffect(() => {
    Object.values(DASHBOARD_BY_ROLE).forEach((path) => router.prefetch(path));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSlow(false);
    setSubmitting(true);
    const timer = setTimeout(() => setSlow(true), 4000);
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
      clearTimeout(timer);
      setSlow(false);
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
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Notice>{error}</Notice>
        <Notice type="info">
          {slow &&
            "The server is waking up after being idle. The first login can take up to a minute."}
        </Notice>

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
