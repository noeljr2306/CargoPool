const PDFDocument = require("pdfkit");

// `db` must be able to see across tenants (admin), since a
// manifest aggregates shipments from many shipper tenants.
async function generateManifest(db, containerId) {
  const container = await db.container.findUnique({
    where: { id: containerId },
  });

  if (!container) throw new Error("Container not found");
  if (container.status !== "CLOSED") {
    throw new Error("Container must be CLOSED before generating a manifest");
  }

  const manifest = await db.manifest.create({
    data: {
      containerId: container.id,
      generatedAt: new Date(),
      pdfUrl: `/api/containers/${container.id}/manifest.pdf`,
      status: "GENERATED",
    },
  });

  return {
    manifest,
    qrCodeUrl: `/api/containers/${container.id}/qr.png`,
  };
}

function renderManifestPdf(container, output) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(output);

  doc.fontSize(18).text("Container Manifest", { align: "center" });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Container ID: ${container.id}`);
  doc.text(`Capacity: ${container.capacity}`);
  doc.text(`Filled: ${container.filledCapacity}`);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();
  doc.fontSize(13).text("Shipments", { underline: true });
  doc.moveDown(0.5);

  container.shipments.forEach((shipment, index) => {
    doc
      .fontSize(11)
      .text(
        `${index + 1}. ${shipment.productDescription} — Qty: ${shipment.quantity} — ` +
          `Weight/Vol: ${shipment.weightVolume} — HS Code: ${shipment.hsCode || "UNCLASSIFIED"} — ` +
          `Destination: ${shipment.destination}`,
      );
    doc.moveDown(0.3);
  });

  doc.end();
}

module.exports = { generateManifest, renderManifestPdf };
