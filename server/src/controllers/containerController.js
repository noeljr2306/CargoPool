const prismaAdmin = require("../lib/prismaAdmin");
const { withTenant } = require("../lib/tenantContext");
const { fillPercentage } = require("../services/poolingService");

// GET /api/containers  (FORWARDER only — own containers, RLS-enforced, unchanged)
async function listMyContainers(req, res) {
  const containers = await withTenant(req.user.tenantId, (tx) =>
    tx.container.findMany({
      where: { forwarderTenantId: req.user.tenantId },
      include: { shipments: true, manifests: true },
      orderBy: { id: "desc" },
    }),
  );

  res.json(containers.map((c) => ({ ...c, fillPercent: fillPercentage(c) })));
}

// GET /api/containers/:id  (any authenticated user — e.g. a shipper
// viewing a container they don't own; deliberately cross-tenant)
async function getContainer(req, res) {
  const container = await prismaAdmin.container.findUnique({
    where: { id: req.params.id },
    include: { shipments: true },
  });

  if (!container) {
    return res.status(404).json({ error: "Container not found" });
  }

  res.json({ ...container, fillPercent: fillPercentage(container) });
}

// PATCH /api/containers/:id/close  (FORWARDER only, RLS-enforced, unchanged)
async function closeContainer(req, res) {
  try {
    const updated = await withTenant(req.user.tenantId, async (tx) => {
      const container = await tx.container.findUnique({
        where: { id: req.params.id },
      });
      if (!container) {
        throw Object.assign(new Error("Container not found"), { status: 404 });
      }
      if (container.status !== "OPEN") {
        throw Object.assign(
          new Error(`Container is already ${container.status}`),
          { status: 409 },
        );
      }
      return tx.container.update({
        where: { id: req.params.id },
        data: { status: "CLOSED" },
      });
    });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getContainer, closeContainer, listMyContainers };
