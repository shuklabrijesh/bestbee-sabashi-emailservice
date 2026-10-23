const express = require('express');
const AdminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Protect all admin routes with admin key or admin auth
router.use(requireAdmin);

router.post('/clients', AdminController.createClient);
router.post('/clients/:clientId/disable', AdminController.disableClient);
router.post('/clients/:clientId/revoke', AdminController.revokeClientTokens);
router.get('/logs', AdminController.getEmailLogs);
router.get('/failures', AdminController.getDeliveryFailures);
router.post('/smtp', AdminController.configureSmtp);
router.get('/audit', AdminController.getAuditLogs);
router.get('/stats', AdminController.getUsageStats);

module.exports = router;
