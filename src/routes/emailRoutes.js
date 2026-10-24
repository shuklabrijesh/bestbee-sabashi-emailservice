const express = require('express');
const EmailController = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All email routes require token authentication
router.use(authenticateToken);

router.post('/admin/email/send', EmailController.sendAdminEmail);
router.post('/support/email/send', EmailController.sendSupportEmail);
router.post('/account/email/send', EmailController.sendAccountEmail);
router.post('/ceo/email/send', EmailController.sendCeoEmail);

module.exports = router;
