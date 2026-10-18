"use client";

import { Fragment, useEffect, useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import FillMeter from "@/components/FillMeter";
import Timeline from "@/components/TimeLine";
import EmptyState from "@/components/EmptyState";
import Notice from "@/components/Notice";
import Code from "@/components/Code";

const EMPTY_FORM = {
  productDescription: "",
  quantity: "",
  weightVolume: "",
  destination: "",
};

const NAV = [
  { label: "New shipment", href: "#new-shipment" },
  { label: "My shipments", href: "#my-shipments" },
];

function ShipperDashboard() {
  const { token } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState({}); // shipmentId -> tracking data
  const [openId, setOpenId] = useState(null);

  async function load() {
    try {
      setShipments(await apiRequest("/api/shipments", { token }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const data = await apiRequest("/api/shipments", {
        method: "POST",
        token,
        body: {
          ...form,
          quantity: Number(form.quantity),
          weightVolume: Number(form.weightVolume),
        },
      });
      setForm(EMPTY_FORM);
      setSuccess(
        `Shipment added to container ${data.container.id.slice(0, 8)} (${data.container.fillPercent}% full).` +
          (data.needsManualClassification
            ? " No HS code matched, so it is waiting for customs review."
            : ""),
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTracking(id) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!tracking[id]) {
      try {
        const data = await apiRequest(`/api/shipments/${id}/tracking`, {
          token,
        });
        setTracking((t) => ({ ...t, [id]: data }));
      } catch (err) {
        setError(err.message);
      }
    }
  }

  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => !s.hsCode).length,
    inTransit: shipments.filter((s) => s.container?.status === "IN_TRANSIT")
      .length,
    delivered: shipments.filter((s) => s.container?.status === "DELIVERED")
      .length,
  };

  return (
    <DashboardLayout
      title="Your shipments"
      subtitle="Submit cargo, watch your container fill up, and follow it to its destination."
      nav={NAV}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total shipments" value={stats.total} />
        <StatCard label="Awaiting HS code" value={stats.pending} />
        <StatCard label="In transit" value={stats.inTransit} />
        <StatCard label="Delivered" value={stats.delivered} />
      </div>

      <section id="new-shipment" className="panel mt-8 p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Submit a shipment
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate">
          We match it to an open container with space, or start a new one.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="label">Product description</label>
            <input
              className="input"
              value={form.productDescription}
              onChange={(e) => update("productDescription", e.target.value)}
              placeholder="e.g. Dried hibiscus flowers, bulk"
              required
            />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              className="input"
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Weight / volume</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.weightVolume}
              onChange={(e) => update("weightVolume", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Destination</label>
            <input
              className="input"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              required
            />
          </div>

          <div className="space-y-3 md:col-span-3">
            <Notice>{error}</Notice>
            <Notice type="success">{success}</Notice>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting…" : "Submit shipment"}
            </button>
          </div>
        </form>
      </section>

      <section id="my-shipments" className="panel mt-8 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Shipment history
          </h2>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-sm text-slate">Loading shipments…</p>
        ) : shipments.length === 0 ? (
          <EmptyState title="No shipments yet">
            Submit your first shipment above and it will show up here.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-line bg-paper">
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Qty</th>
                  <th className="th">Volume</th>
                  <th className="th">Destination</th>
                  <th className="th">HS code</th>
                  <th className="th">Container</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shipments.map((s) => (
                  <Fragment key={s.id}>
                    <tr>
                      <td className="td">
                        <p className="font-medium">{s.productDescription}</p>
                        <p className="text-xs text-slate">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="td">{s.quantity}</td>
                      <td className="td">{s.weightVolume}</td>
                      <td className="td">{s.destination}</td>
                      <td className="td">
                        {s.hsCode ? (
                          <Code>{s.hsCode}</Code>
                        ) : (
                          <StatusBadge status="PENDING" label="Awaiting code" />
                        )}
                      </td>
                      <td className="td">
                        {s.container ? (
                          <div className="w-40 space-y-2">
                            <FillMeter percent={s.container.fillPercent} />
                            <StatusBadge status={s.container.status} />
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="td">
                        <button
                          onClick={() => toggleTracking(s.id)}
                          className="font-medium text-cargo-dark"
                        >
                          {openId === s.id ? "Hide" : "Track"}
                        </button>
                      </td>
                    </tr>

                    {openId === s.id && (
                      <tr>
                        <td colSpan={7} className="bg-paper px-5 py-5">
                          {tracking[s.id] ? (
                            <div className="max-w-md">
                              <p className="mb-4 text-sm text-slate">
                                Container status:{" "}
                                <StatusBadge
                                  status={
                                    tracking[s.id].containerStatus || "OPEN"
                                  }
                                />
                              </p>
                              <div className="rounded-md bg-white p-4">
                                <Timeline
                                  events={tracking[s.id].trackingHistory}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate">
                              Loading tracking…
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <RequireAuth role="SHIPPER">
      <ShipperDashboard />
    </RequireAuth>
  );
}
