const express = require('express');
const EmailController = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All email routes require token authentication
router.use(authenticateToken);

// Admin Routes
router.post('/admin/email/send', EmailController.sendAdminEmail);
router.post('/admin/email/sendbulk', EmailController.sendAdminBulk);

// Support Routes
router.post('/support/email/send', EmailController.sendSupportEmail);
router.post('/support/email/sendbulk', EmailController.sendSupportBulk);

// Account Routes
router.post('/account/email/send', EmailController.sendAccountEmail);
router.post('/account/email/sendbulk', EmailController.sendAccountBulk);

// CEO Routes
router.post('/ceo/email/send', EmailController.sendCeoEmail);
router.post('/ceo/email/sendbulk', EmailController.sendCeoBulk);

module.exports = router;
