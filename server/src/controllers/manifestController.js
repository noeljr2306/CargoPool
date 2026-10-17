const prismaAdmin = require("../lib/prismaAdmin");
const {
  generateManifest,
  renderManifestPdf,
} = require("../services/manifestService");
const { containerQrBuffer } = require("../services/qrCodeService");
const { withTenant } = require("../lib/tenantContext");

// POST /api/containers/:id/manifest (FORWARDER only)
async function createManifest(req, res) {
  try {
    const container = await withTenant(req.user.tenantId, (tx) =>
      tx.container.findUnique({ where: { id: req.params.id } }),
    );
    if (!container) {
      return res.status(404).json({ error: "Container not found" });
    }

    const { manifest, qrCodeUrl } = await generateManifest(
      prismaAdmin,
      req.params.id,
    );
    res.status(201).json({ manifest, qrCodeUrl });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
}

// GET /api/containers/:id/manifest.pdf (public by unguessable container ID)
async function downloadManifestPdf(req, res) {
  const container = await prismaAdmin.container.findUnique({
    where: { id: req.params.id },
    include: { shipments: true, manifests: true },
  });
  if (!container || container.manifests.length === 0) {
    return res.status(404).json({ error: "Manifest not found" });
  }

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Content-Type", "application/pdf");
  renderManifestPdf(container, res);
}

// GET /api/containers/:id/qr.png (public by unguessable container ID)
async function qrImage(req, res) {
  const container = await prismaAdmin.container.findUnique({
    where: { id: req.params.id },
    include: { manifests: true },
  });
  if (!container || container.manifests.length === 0) {
    return res.status(404).json({ error: "QR code not available yet" });
  }

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.type("png").send(await containerQrBuffer(container.id));
}

module.exports = { createManifest, downloadManifestPdf, qrImage };
