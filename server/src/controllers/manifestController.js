const prismaAdmin = require("../lib/prismaAdmin");
const { generateManifest } = require("../services/manifestService");
const { withTenant } = require("../lib/tenantContext");

// POST /api/containers/:id/manifest  (FORWARDER only)
async function createManifest(req, res) {
  try {
    // Ownership check stays RLS-enforced — proves the caller actually
    // owns this container before we touch cross-tenant data.
    const container = await withTenant(req.user.tenantId, (tx) =>
      tx.container.findUnique({ where: { id: req.params.id } }),
    );
    if (!container) {
      return res.status(404).json({ error: "Container not found" });
    }

    // Manifest generation itself aggregates shipments across shipper
    // tenants, so it runs on the admin client.
    const { manifest, qrCodeUrl } = await generateManifest(
      prismaAdmin,
      req.params.id,
    );
    res.status(201).json({ manifest, qrCodeUrl });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
}

module.exports = { createManifest };
