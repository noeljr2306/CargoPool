"use client";

import { useEffect, useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import Notice from "@/components/Notice";

const NAV = [{ label: "Review queue", href: "#queue" }];

function CustomsDashboard() {
  const { token } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState({}); // shipmentId -> typed value
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setShipments(await apiRequest("/api/shipments/review", { token }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAssign(id) {
    const hsCode = (codes[id] || "").trim();
    if (!hsCode) return;
    setError("");
    setBusyId(id);
    try {
      await apiRequest(`/api/shipments/${id}/hs-code`, {
        method: "PATCH",
        token,
        body: { hsCode },
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout
      title="Customs review queue"
      subtitle="Shipments the keyword engine could not classify. Assign an HS code to release them."
      nav={NAV}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting classification" value={shipments.length} />
        <StatCard
          label="Oldest waiting since"
          value={
            shipments[0]
              ? new Date(shipments[0].createdAt).toLocaleDateString()
              : "—"
          }
        />
      </div>

      <div className="mt-6">
        <Notice>{error}</Notice>
      </div>

      <section id="queue" className="panel mt-6 overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate">Loading queue…</p>
        ) : shipments.length === 0 ? (
          <EmptyState title="All caught up">
            Every shipment has an HS code. New unmatched shipments will appear
            here.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-line bg-paper">
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Shipper</th>
                  <th className="th">Qty</th>
                  <th className="th">Destination</th>
                  <th className="th">Submitted</th>
                  <th className="th">Assign HS code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shipments.map((s) => (
                  <tr key={s.id}>
                    <td className="td font-medium">{s.productDescription}</td>
                    <td className="td">{s.shipperTenant?.name || "—"}</td>
                    <td className="td">{s.quantity}</td>
                    <td className="td">{s.destination}</td>
                    <td className="td text-slate">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="td">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAssign(s.id);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          className="input w-32 font-mono"
                          placeholder="e.g. 1211.90"
                          value={codes[s.id] || ""}
                          onChange={(e) =>
                            setCodes((c) => ({ ...c, [s.id]: e.target.value }))
                          }
                        />
                        <button
                          type="submit"
                          disabled={busyId === s.id || !codes[s.id]}
                          className="btn-primary"
                        >
                          Assign
                        </button>
                      </form>
                    </td>
                  </tr>
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
    <RequireAuth role="CUSTOMS_AGENT">
      <CustomsDashboard />
    </RequireAuth>
  );
}
