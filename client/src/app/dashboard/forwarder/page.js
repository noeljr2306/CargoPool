"use client";

import { useEffect, useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Code from "@/components/Code";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function ForwarderDashboard() {
  const { token } = useAuth();
  const [containers, setContainers] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const data = await apiRequest("/api/containers", { token });
    setContainers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleClose(id) {
    setError("");
    setBusyId(id);
    try {
      await apiRequest(`/api/containers/${id}/close`, {
        method: "PATCH",
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerateManifest(id) {
    setError("");
    setBusyId(id);
    try {
      await apiRequest(`/api/containers/${id}/manifest`, {
        method: "POST",
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout title="Forwarder dashboard">
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {containers.length === 0 && (
        <p className="text-slate">No containers yet.</p>
      )}

      <div className="space-y-4">
        {containers.map((c) => {
          const manifest = c.manifests?.[0];
          return (
            <div
              key={c.id}
              className="bg-white border border-slate/15 rounded p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-ink">
                    Container <Code>{c.id.slice(0, 8)}</Code>
                  </p>
                  <p className="text-sm text-slate mt-0.5">
                    Status:{" "}
                    <span className="text-ink font-medium">{c.status}</span> ·{" "}
                    {c.shipments.length} shipment(s)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="w-32 h-2 bg-paper border border-slate/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sea"
                      style={{ width: `${c.fillPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate mt-1">
                    {c.fillPercent}% full
                  </p>
                </div>
              </div>

              <ul className="text-sm text-slate space-y-1 mb-4">
                {c.shipments.map((s) => (
                  <li key={s.id}>
                    {s.productDescription} —{" "}
                    {s.hsCode ? (
                      <Code>{s.hsCode}</Code>
                    ) : (
                      <span className="text-cargo">unclassified</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-3">
                {c.status === "OPEN" && (
                  <button
                    onClick={() => handleClose(c.id)}
                    disabled={busyId === c.id}
                    className="border border-slate/30 text-ink rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Close container
                  </button>
                )}

                {c.status === "CLOSED" && !manifest && (
                  <button
                    onClick={() => handleGenerateManifest(c.id)}
                    disabled={busyId === c.id}
                    className="bg-cargo hover:bg-cargo/90 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Generate manifest
                  </button>
                )}

                {manifest && (
                  <a
                    href={`${API_URL}${manifest.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cargo text-sm font-medium"
                  >
                    View manifest PDF →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <RequireAuth role="FORWARDER">
      <ForwarderDashboard />
    </RequireAuth>
  );
}
