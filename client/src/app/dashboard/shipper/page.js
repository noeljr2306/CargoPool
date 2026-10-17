"use client";

import { useEffect, useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Code from "@/components/Code";

function ShipperDashboard() {
  const { token } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({
    productDescription: "",
    quantity: "",
    weightVolume: "",
    destination: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState({}); // shipmentId -> tracking data

  async function loadShipments() {
    const data = await apiRequest("/api/shipments", { token });
    setShipments(data);
  }

  useEffect(() => {
    loadShipments();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest("/api/shipments", {
        method: "POST",
        token,
        body: {
          ...form,
          quantity: Number(form.quantity),
          weightVolume: Number(form.weightVolume),
        },
      });
      setForm({
        productDescription: "",
        quantity: "",
        weightVolume: "",
        destination: "",
      });
      await loadShipments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTracking(shipmentId) {
    if (tracking[shipmentId]) {
      setTracking((t) => ({ ...t, [shipmentId]: null }));
      return;
    }
    const data = await apiRequest(`/api/shipments/${shipmentId}/tracking`, {
      token,
    });
    setTracking((t) => ({ ...t, [shipmentId]: data }));
  }

  return (
    <DashboardLayout title="Shipper dashboard">
      <section className="bg-white border border-slate/15 rounded p-6 mb-10">
        <h2 className="font-display font-semibold text-lg text-ink mb-4">
          Submit a shipment
        </h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1.5">
              Product description
            </label>
            <input
              className="w-full border border-slate/30 rounded px-3 py-2.5 focus-visible:border-cargo"
              value={form.productDescription}
              onChange={(e) => update("productDescription", e.target.value)}
              placeholder="e.g. Dried hibiscus flowers, bulk"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              className="w-full border border-slate/30 rounded px-3 py-2.5 focus-visible:border-cargo"
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Weight / volume
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-slate/30 rounded px-3 py-2.5 focus-visible:border-cargo"
              value={form.weightVolume}
              onChange={(e) => update("weightVolume", e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1.5">
              Destination
            </label>
            <input
              className="w-full border border-slate/30 rounded px-3 py-2.5 focus-visible:border-cargo"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm md:col-span-2">{error}</p>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-cargo hover:bg-cargo/90 text-white rounded px-5 py-2.5 font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit shipment"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg text-ink mb-4">
          Your shipments
        </h2>
        {shipments.length === 0 && (
          <p className="text-slate">No shipments yet.</p>
        )}

        <div className="space-y-3">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate/15 rounded p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{s.productDescription}</p>
                  <p className="text-sm text-slate mt-0.5">
                    Qty {s.quantity} · {s.weightVolume} vol · {s.destination}
                  </p>
                  <p className="text-sm mt-1">
                    HS code:{" "}
                    {s.hsCode ? (
                      <Code>{s.hsCode}</Code>
                    ) : (
                      <span className="text-cargo">Pending classification</span>
                    )}
                  </p>
                </div>
                {s.container && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate mb-1">Container fill</p>
                    <div className="w-24 h-2 bg-paper border border-slate/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sea"
                        style={{ width: `${s.container.fillPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate mt-1">
                      {s.container.fillPercent}%
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleTracking(s.id)}
                className="text-sm text-cargo font-medium mt-3"
              >
                {tracking[s.id] ? "Hide tracking" : "View tracking"}
              </button>

              {tracking[s.id] && (
                <div className="mt-3 pt-3 border-t border-slate/10">
                  <p className="text-sm text-slate mb-2">
                    Container status:{" "}
                    <span className="text-ink font-medium">
                      {tracking[s.id].containerStatus}
                    </span>
                  </p>
                  {tracking[s.id].trackingHistory.length === 0 ? (
                    <p className="text-sm text-slate">No scan events yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {tracking[s.id].trackingHistory.map((ev) => (
                        <li
                          key={ev.id}
                          className="text-sm flex justify-between"
                        >
                          <span className="text-ink">{ev.milestone}</span>
                          <span className="text-slate">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
