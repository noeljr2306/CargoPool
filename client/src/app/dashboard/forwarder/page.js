"use client";

import { useEffect, useState } from "react";
import apiRequest from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import FillMeter from "@/components/FillMeter";
import EmptyState from "@/components/EmptyState";
import Notice from "@/components/Notice";
import Code from "@/components/Code";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const NAV = [{ label: "Containers", href: "#containers" }];

function ForwarderDashboard() {
  const { token } = useAuth();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // shipment id being edited
  const [codeInput, setCodeInput] = useState("");

  async function load() {
    try {
      setContainers(await apiRequest("/api/containers", { token }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(id, fn) {
    setError("");
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const handleClose = (id) =>
    run(id, () =>
      apiRequest(`/api/containers/${id}/close`, { method: "PATCH", token }),
    );

  const handleManifest = (id) =>
    run(id, () =>
      apiRequest(`/api/containers/${id}/manifest`, { method: "POST", token }),
    );

  async function saveCode(shipmentId) {
    const hsCode = codeInput.trim();
    if (!hsCode) return;
    await run(shipmentId, () =>
      apiRequest(`/api/shipments/${shipmentId}/hs-code`, {
        method: "PATCH",
        token,
        body: { hsCode },
      }),
    );
    setEditing(null);
  }

  const stats = {
    total: containers.length,
    open: containers.filter((c) => c.status === "OPEN").length,
    manifests: containers.filter((c) => c.manifests?.length > 0).length,
    shipments: containers.reduce((sum, c) => sum + c.shipments.length, 0),
  };

  return (
    <DashboardLayout
      title="Containers"
      subtitle="Close pooling, review HS codes and issue manifests for the containers you manage."
      nav={NAV}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Containers" value={stats.total} />
        <StatCard label="Open for pooling" value={stats.open} />
        <StatCard label="Manifests issued" value={stats.manifests} />
        <StatCard label="Shipments pooled" value={stats.shipments} />
      </div>

      <div className="mt-6">
        <Notice>{error}</Notice>
      </div>

      <section id="containers" className="mt-6">
        {loading ? (
          <p className="text-sm text-slate">Loading containers…</p>
        ) : containers.length === 0 ? (
          <div className="panel">
            <EmptyState title="No containers yet">
              A container is created automatically when a shipper submits the
              first shipment.
            </EmptyState>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {containers.map((c) => {
              const manifest = c.manifests?.[0];
              const busy = busyId === c.id;

              return (
                <article key={c.id} className="panel flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold text-ink">
                        Container <Code>{c.id.slice(0, 8)}</Code>
                      </h2>
                      {c.departureDeadline && (
                        <p className="mt-0.5 text-xs text-slate">
                          Departs by{" "}
                          {new Date(c.departureDeadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="mt-4">
                    <FillMeter
                      percent={c.fillPercent}
                      label={`${c.filledCapacity} of ${c.capacity} units`}
                    />
                  </div>

                  <div className="mt-5 flex-1">
                    <p className="mb-1 text-sm font-medium text-ink">
                      Shipments ({c.shipments.length})
                    </p>
                    {c.shipments.length === 0 ? (
                      <p className="text-sm text-slate">Nothing pooled yet.</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {c.shipments.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between gap-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {s.productDescription}
                              </p>
                              <p className="text-xs text-slate">
                                {s.destination} · {s.weightVolume} vol
                              </p>
                            </div>

                            {editing === s.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveCode(s.id);
                                }}
                                className="flex items-center gap-2"
                              >
                                <input
                                  className="input w-28 font-mono"
                                  value={codeInput}
                                  onChange={(e) => setCodeInput(e.target.value)}
                                  placeholder="HS code"
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  disabled={busyId === s.id}
                                  className="btn-primary"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditing(null)}
                                  className="btn-secondary"
                                >
                                  Cancel
                                </button>
                              </form>
                            ) : (
                              <div className="flex shrink-0 items-center gap-3">
                                {s.hsCode ? (
                                  <Code>{s.hsCode}</Code>
                                ) : (
                                  <StatusBadge
                                    status="PENDING"
                                    label="Unclassified"
                                  />
                                )}
                                <button
                                  onClick={() => {
                                    setEditing(s.id);
                                    setCodeInput(s.hsCode || "");
                                  }}
                                  className="text-xs font-medium text-cargo-dark"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    {c.status === "OPEN" && (
                      <button
                        onClick={() => handleClose(c.id)}
                        disabled={busy}
                        className="btn-secondary"
                      >
                        Close container
                      </button>
                    )}
                    {c.status === "CLOSED" && !manifest && (
                      <button
                        onClick={() => handleManifest(c.id)}
                        disabled={busy}
                        className="btn-primary"
                      >
                        Generate manifest
                      </button>
                    )}
                    {manifest && (
                      <>
                        <a
                          href={`${API_URL}${manifest.pdfUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                        >
                          View manifest PDF
                        </a>
                        <a
                          href={`${API_URL}/api/containers/${c.id}/qr.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                        >
                          QR code
                        </a>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
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
