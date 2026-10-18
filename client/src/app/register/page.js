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
  const { login } = useAuth();
  const router = useRouter();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
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
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
        </div>

        <Notice>{error}</Notice>

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
