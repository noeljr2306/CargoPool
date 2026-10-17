"use client";

import { useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";

const MILESTONES = [
  "DEPARTED",
  "IN_TRANSIT",
  "CUSTOMS_CLEARED",
  "ARRIVED",
  "DELIVERED",
];

function TransportDashboard() {
  const { token } = useAuth();
  const [containerId, setContainerId] = useState("");
  const [milestone, setMilestone] = useState(MILESTONES[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await apiRequest("/api/tracking/scan", {
        method: "POST",
        token,
        body: { containerId, milestone },
      });
      setSuccess(`Recorded "${milestone}" for that container.`);
      setContainerId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Scan a milestone">
      <div className="bg-white border border-slate/15 rounded p-6 max-w-md">
        <p className="text-sm text-slate mb-6">
          Enter the container ID from the QR code and select the milestone
          reached.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Container ID
            </label>
            <input
              className="w-full border border-slate/30 rounded px-3 py-2.5 font-mono text-sm focus-visible:border-cargo"
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              placeholder="Paste or scan the container ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Milestone
            </label>
            <select
              className="w-full border border-slate/30 rounded px-3 py-2.5 focus-visible:border-cargo"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
            >
              {MILESTONES.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-sea text-sm">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cargo hover:bg-cargo/90 text-white rounded py-2.5 font-medium disabled:opacity-50"
          >
            {submitting ? "Recording…" : "Record scan"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <RequireAuth role="TRANSPORT_PERSONNEL">
      <TransportDashboard />
    </RequireAuth>
  );
}
