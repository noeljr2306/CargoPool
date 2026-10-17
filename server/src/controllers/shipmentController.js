const prismaAdmin = require("../lib/prismaAdmin");
const { withTenant } = require("../lib/tenantContext");
const {
  matchOrCreateContainer,
  addToContainer,
  fillPercentage,
} = require("../services/poolingService");
const { classify } = require("../services/hsCodeService");

// POST /api/shipments  (SHIPPER only)
async function createShipment(req, res) {
  const { productDescription, quantity, weightVolume, destination } = req.body;

  if (!productDescription || !quantity || !weightVolume || !destination) {
    return res.status(400).json({
      error:
        "productDescription, quantity, weightVolume and destination are required",
    });
  }
  if (typeof weightVolume !== "number" || weightVolume <= 0) {
    return res
      .status(400)
      .json({ error: "weightVolume must be a positive number" });
  }

  // Finding/creating a poolable container is cross-tenant by nature
  // (a shipper needs visibility into forwarders' open containers).
  const container = await matchOrCreateContainer(prismaAdmin, weightVolume);
  const hsCode = await classify(productDescription);

  const { shipment, updatedContainer } = await withTenant(
    req.user.tenantId,
    async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          shipperTenantId: req.user.tenantId,
          containerId: container.id,
          productDescription,
          quantity,
          weightVolume,
          destination,
          hsCode,
        },
      });

      // Also cross-tenant: this container belongs to a forwarder tenant.
      const updatedContainer = await addToContainer(
        prismaAdmin,
        container.id,
        weightVolume,
      );

      return { shipment, updatedContainer };
    },
  );

  res.status(201).json({
    shipment,
    needsManualClassification: hsCode === null,
    container: {
      ...updatedContainer,
      fillPercent: fillPercentage(updatedContainer),
    },
  });
}

// GET /api/shipments  (SHIPPER — own tenant's shipments only, RLS-enforced)
async function listMyShipments(req, res) {
  const shipments = await withTenant(req.user.tenantId, (tx) =>
    tx.shipment.findMany({
      where: { shipperTenantId: req.user.tenantId },
      include: { container: true },
      orderBy: { createdAt: "desc" },
    }),
  );

  const withFill = shipments.map((s) => ({
    ...s,
    container: s.container
      ? { ...s.container, fillPercent: fillPercentage(s.container) }
      : null,
  }));

  res.json(withFill);
}

// GET /api/shipments/review  (FORWARDER, CUSTOMS_AGENT — deliberately cross-tenant)
async function listForReview(req, res) {
  const shipments = await prismaAdmin.shipment.findMany({
    where: { hsCode: null },
    include: { shipperTenant: true, container: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(shipments);
}

// PATCH /api/shipments/:id/hs-code  (FORWARDER, CUSTOMS_AGENT — deliberately cross-tenant)
async function overrideHsCode(req, res) {
  const { hsCode } = req.body;
  if (!hsCode) {
    return res.status(400).json({ error: "hsCode is required" });
  }

  const shipment = await prismaAdmin.shipment.findUnique({
    where: { id: req.params.id },
  });
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }

  const updated = await prismaAdmin.shipment.update({
    where: { id: req.params.id },
    data: { hsCode },
  });

  await prismaAdmin.auditLog.create({
    data: {
      userId: req.user.userId,
      action: `Overrode HS code to ${hsCode}`,
      tableAffected: "shipment",
    },
  });

  res.json(updated);
}

module.exports = {
  createShipment,
  listMyShipments,
  overrideHsCode,
  listForReview,
};
