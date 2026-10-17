const QRCode = require("qrcode");

const TRACKING_BASE_URL =
  process.env.TRACKING_BASE_URL || "http://localhost:3000/track";

async function containerQrBuffer(containerId) {
  return QRCode.toBuffer(`${TRACKING_BASE_URL}/${containerId}`, {
    width: 300,
  });
}

module.exports = { containerQrBuffer };
