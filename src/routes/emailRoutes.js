const express = require('express');
const EmailController = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.post('/send', EmailController.send);

module.exports = router;
