"use client";

import { useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Timeline from "@/components/Timeline";
import Notice from "@/components/Notice";

const MILESTONES = [
  { value: "DEPARTED", label: "Departed" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "CUSTOMS_CLEARED", label: "Customs cleared" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "DELIVERED", label: "Delivered" },
];

const NAV = [
  { label: "Record a scan", href: "#scan" },
  { label: "This session", href: "#session" },
];

function TransportDashboard() {
  const { token } = useAuth();
  const [containerId, setContainerId] = useState("");
  const [milestone, setMilestone] = useState(MILESTONES[0].value);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recorded, setRecorded] = useState([]); // scans made during this visit, newest first

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const event = await apiRequest("/api/tracking/scan", {
        method: "POST",
        token,
        body: { containerId: containerId.trim(), milestone },
      });
      setRecorded((list) => [
        {
          id: event.id,
          milestone: event.milestone,
          timestamp: event.timestamp,
          detail: event.containerId.slice(0, 8),
        },
        ...list,
      ]);
      setSuccess("Scan recorded. The shipper can now see this update.");
      setContainerId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      title="Record a milestone"
      subtitle="Enter the container ID from its QR code and choose the milestone it has reached."
      nav={NAV}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
        <section id="scan" className="panel p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Container ID</label>
              <input
                className="input font-mono"
                value={containerId}
                onChange={(e) => setContainerId(e.target.value)}
                placeholder="Paste the container ID"
                required
              />
            </div>

            <div>
              <p className="label">Milestone</p>
              <div className="flex flex-wrap gap-2">
                {MILESTONES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={milestone === m.value}
                    onClick={() => setMilestone(m.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      milestone === m.value
                        ? "border-navy bg-navy text-paper"
                        : "border-line bg-white text-ink hover:bg-paper"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Notice>{error}</Notice>
            <Notice type="success">{success}</Notice>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Recording…" : "Record scan"}
            </button>
          </form>
        </section>

        <section id="session" className="panel p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">
            Recorded this session
          </h2>
          <Timeline
            events={recorded}
            newestFirst
            emptyText="Scans you record will appear here."
          />
        </section>
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
