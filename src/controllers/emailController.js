const emailService = require('../services/emailService');
const logger = require('../utils/logger');

class EmailController {
  static async sendAdminEmail(req, res) {
    return EmailController._handleSend(req, res, 'admin', '/api/admin/email/send');
  }

  static async sendAdminBulk(req, res) {
    return EmailController._handleSend(req, res, 'admin', '/api/admin/email/sendbulk');
  }

  static async sendSupportEmail(req, res) {
    return EmailController._handleSend(req, res, 'support', '/api/support/email/send');
  }

  static async sendSupportBulk(req, res) {
    return EmailController._handleSend(req, res, 'support', '/api/support/email/sendbulk');
  }

  static async sendAccountEmail(req, res) {
    return EmailController._handleSend(req, res, 'account', '/api/account/email/send');
  }

  static async sendAccountBulk(req, res) {
    return EmailController._handleSend(req, res, 'account', '/api/account/email/sendbulk');
  }

  static async sendCeoEmail(req, res) {
    return EmailController._handleSend(req, res, 'ceo', '/api/ceo/email/send');
  }

  static async sendCeoBulk(req, res) {
    return EmailController._handleSend(req, res, 'ceo', '/api/ceo/email/sendbulk');
  }

  static async _handleSend(req, res, namespace, endpoint) {
    const { to, recipients, subject, text, html } = req.body;
    const clientId = req.client.clientId;

    const recipientList = recipients || to;

    logger.info(`API request received at ${endpoint} from client ${clientId}`);

    if (!recipientList || (!text && !html)) {
      logger.warn(`Validation failed at ${endpoint} for client ${clientId}: Missing recipient or content`);
      return res.status(400).json({ error: 'Recipients ("to" or "recipients") and message content (text or html) are required' });
    }

    try {
      const result = await emailService.sendEmail({
        clientId,
        endpoint,
        namespace,
        recipientsInput: recipientList,
        subject,
        text,
        html
      });
      res.json(result);
    } catch (error) {
      logger.error(`Controller error at ${endpoint} for client ${clientId}: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = EmailController;
