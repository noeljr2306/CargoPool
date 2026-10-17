const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { generateContainerQrCode } = require("./qrCodeService");

const MANIFESTS_DIR = path.join(__dirname, "..", "..", "uploads", "manifests");

// `db` must be a client that can see across tenants (admin), since a
// manifest aggregates shipments from potentially many shipper tenants.
async function generateManifest(db, containerId) {
  const container = await db.container.findUnique({
    where: { id: containerId },
    include: { shipments: true },
  });

  if (!container) throw new Error("Container not found");
  if (container.status !== "CLOSED")
    throw new Error("Container must be CLOSED before generating a manifest");

  if (!fs.existsSync(MANIFESTS_DIR))
    fs.mkdirSync(MANIFESTS_DIR, { recursive: true });

  const fileName = `manifest-${container.id}.pdf`;
  const filePath = path.join(MANIFESTS_DIR, fileName);
  await writeManifestPdf(container, filePath);

  const pdfUrl = `/uploads/manifests/${fileName}`;
  const qrCodeUrl = await generateContainerQrCode(container.id);

  const manifest = await db.manifest.create({
    data: {
      containerId: container.id,
      generatedAt: new Date(),
      pdfUrl,
      status: "GENERATED",
    },
  });

  return { manifest, qrCodeUrl };
}

function writeManifestPdf(container, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

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

    container.shipments.forEach((s, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${s.productDescription} — Qty: ${s.quantity} — ` +
            `Weight/Vol: ${s.weightVolume} — HS Code: ${s.hsCode || "UNCLASSIFIED"} — ` +
            `Destination: ${s.destination}`,
        );
      doc.moveDown(0.3);
    });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

module.exports = { generateManifest };
