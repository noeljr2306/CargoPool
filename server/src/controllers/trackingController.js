const prismaAdmin = require("../lib/prismaAdmin");

const VALID_MILESTONES = [
  "DEPARTED",
  "IN_TRANSIT",
  "CUSTOMS_CLEARED",
  "ARRIVED",
  "DELIVERED",
];

// POST /api/tracking/scan — transport personnel aren't a forwarder
// tenant at all, so this is inherently cross-tenant.
async function scanMilestone(req, res) {
  const { containerId, milestone } = req.body;

  if (!containerId || !milestone) {
    return res
      .status(400)
      .json({ error: "containerId and milestone are required" });
  }
  if (!VALID_MILESTONES.includes(milestone)) {
    return res
      .status(400)
      .json({
        error: `milestone must be one of: ${VALID_MILESTONES.join(", ")}`,
      });
  }

  const container = await prismaAdmin.container.findUnique({
    where: { id: containerId },
  });
  if (!container) {
    return res.status(404).json({ error: "Container not found" });
  }

  const event = await prismaAdmin.trackingEvent.create({
    data: { containerId, scannedByUserId: req.user.userId, milestone },
  });

  if (milestone === "DELIVERED") {
    await prismaAdmin.container.update({
      where: { id: containerId },
      data: { status: "DELIVERED" },
    });
  }

  res.status(201).json(event);
}

// GET /api/shipments/:id/tracking  (SHIPPER — own shipment only)
// Fetch is cross-tenant (joins the container and its events), but
// visibility is manually enforced right after: only the owning
// shipper tenant gets the data back.
async function getShipmentTracking(req, res) {
  const shipment = await prismaAdmin.shipment.findUnique({
    where: { id: req.params.id },
    include: {
      container: {
        include: {
          trackingEvents: {
            orderBy: { timestamp: "asc" },
            include: {
              scannedBy: { select: { id: true, email: true, role: true } },
            },
          },
        },
      },
    },
  });

  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  if (shipment.shipperTenantId !== req.user.tenantId) {
    return res.status(403).json({ error: "This is not your shipment" });
  }

  res.json({
    shipment: {
      id: shipment.id,
      productDescription: shipment.productDescription,
      hsCode: shipment.hsCode,
      destination: shipment.destination,
    },
    containerStatus: shipment.container ? shipment.container.status : null,
    trackingHistory: shipment.container
      ? shipment.container.trackingEvents
      : [],
  });
}

module.exports = { scanMilestone, getShipmentTracking };
