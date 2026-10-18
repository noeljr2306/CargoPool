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
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    tenantName: "",
    tenantType: "SHIPPER",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useWarmup();

  useEffect(() => {
    Object.values(DASHBOARD_BY_ROLE).forEach((path) => router.prefetch(path));
  }, [router]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSlow(false);
    setSubmitting(true);
    const timer = setTimeout(() => setSlow(true), 4000);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: form,
      });
      login(data.token, data.user);
      router.push(DASHBOARD_BY_ROLE[data.user.role]);
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(timer);
      setSlow(false);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Register as a shipper or a forwarder."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Company / organization name</label>
          <input
            className="input"
            value={form.tenantName}
            onChange={(e) => update("tenantName", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Account type</label>
          <select
            className="input"
            value={form.tenantType}
            onChange={(e) => update("tenantType", e.target.value)}
          >
            <option value="SHIPPER">Shipper</option>
            <option value="FORWARDER">Forwarder</option>
          </select>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <Notice>{error}</Notice>
        <Notice type="info">
          {slow &&
            "The server is waking up after being idle. The first signup can take up to a minute."}
        </Notice>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-cargo-dark">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
