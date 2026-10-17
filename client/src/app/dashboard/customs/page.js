"use client";

import { useEffect, useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";

function CustomsDashboard() {
  const { token } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [codes, setCodes] = useState({}); // shipmentId -> input value
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const data = await apiRequest("/api/shipments/review", { token });
    setShipments(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAssign(id) {
    const hsCode = codes[id];
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
    <DashboardLayout title="Customs review queue">
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {shipments.length === 0 && (
        <p className="text-slate">Nothing awaiting classification.</p>
      )}

      <div className="space-y-3">
        {shipments.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-slate/15 rounded p-4 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-medium text-ink">{s.productDescription}</p>
              <p className="text-sm text-slate mt-0.5">
                {s.shipperTenant?.name} · Qty {s.quantity} · {s.destination}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                className="border border-slate/30 rounded px-3 py-2 text-sm w-32 font-mono focus-visible:border-cargo"
                placeholder="HS code"
                value={codes[s.id] || ""}
                onChange={(e) =>
                  setCodes((c) => ({ ...c, [s.id]: e.target.value }))
                }
              />
              <button
                onClick={() => handleAssign(s.id)}
                disabled={busyId === s.id || !codes[s.id]}
                className="bg-cargo hover:bg-cargo/90 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>
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
