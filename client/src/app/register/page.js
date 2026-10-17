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
          <label className="block text-sm font-medium text-ink mb-1.5">
            Company / organization name
          </label>
          <input
            className="w-full border border-slate/30 rounded px-3 py-2.5 bg-white text-ink focus-visible:border-cargo"
            value={form.tenantName}
            onChange={(e) => update("tenantName", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Account type
          </label>
          <select
            className="w-full border border-slate/30 rounded px-3 py-2.5 bg-white text-ink focus-visible:border-cargo"
            value={form.tenantType}
            onChange={(e) => update("tenantType", e.target.value)}
          >
            <option value="SHIPPER">Shipper</option>
            <option value="FORWARDER">Forwarder</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Email
          </label>
          <input
            type="email"
            className="w-full border border-slate/30 rounded px-3 py-2.5 bg-white text-ink focus-visible:border-cargo"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
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
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cargo hover:bg-cargo/90 text-white rounded py-2.5 font-medium transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="text-sm text-slate mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-cargo font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
