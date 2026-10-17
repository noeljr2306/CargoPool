const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const QRCODES_DIR = path.join(__dirname, '..', '..', 'uploads', 'qrcodes');

// Change this to your real deployed frontend URL later (Phase 7).
const TRACKING_BASE_URL = process.env.TRACKING_BASE_URL || 'http://localhost:3000/track';

// Generates a QR code PNG that encodes a public tracking link for
// this container. Returns the relative URL where it's served from.
async function generateContainerQrCode(containerId) {
  if (!fs.existsSync(QRCODES_DIR)) {
    fs.mkdirSync(QRCODES_DIR, { recursive: true });
  }

  const trackingUrl = `${TRACKING_BASE_URL}/${containerId}`;
  const fileName = `container-${containerId}.png`;
  const filePath = path.join(QRCODES_DIR, fileName);

  await QRCode.toFile(filePath, trackingUrl, { width: 300 });

  return `/uploads/qrcodes/${fileName}`;
}

module.exports = { generateContainerQrCode };