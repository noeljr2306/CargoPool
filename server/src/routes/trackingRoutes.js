const express = require('express');
const { scanMilestone, getShipmentTracking } = require('../controllers/trackingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/tracking/scan', authenticate, authorize('TRANSPORT_PERSONNEL', 'FORWARDER'), scanMilestone);
router.get('/shipments/:id/tracking', authenticate, authorize('SHIPPER'), getShipmentTracking);

module.exports = router;