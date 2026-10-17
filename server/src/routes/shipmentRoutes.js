const express = require('express');
const { createShipment, listMyShipments, overrideHsCode, listForReview } = require('../controllers/shipmentController');
const { getContainer, closeContainer, listMyContainers } = require('../controllers/containerController');
const {
  createManifest,
  downloadManifestPdf,
  qrImage,
} = require('../controllers/manifestController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/shipments', authenticate, authorize('SHIPPER'), createShipment);
router.get('/shipments', authenticate, authorize('SHIPPER'), listMyShipments);
router.get('/shipments/review', authenticate, authorize('FORWARDER', 'CUSTOMS_AGENT'), listForReview);
router.patch('/shipments/:id/hs-code', authenticate, authorize('FORWARDER', 'CUSTOMS_AGENT'), overrideHsCode);

router.get('/containers/:id/manifest.pdf', downloadManifestPdf);
router.get('/containers/:id/qr.png', qrImage);

router.get('/containers', authenticate, authorize('FORWARDER'), listMyContainers);
router.get('/containers/:id', authenticate, getContainer);
router.patch('/containers/:id/close', authenticate, authorize('FORWARDER'), closeContainer);
router.post('/containers/:id/manifest', authenticate, authorize('FORWARDER'), createManifest);

module.exports = router;