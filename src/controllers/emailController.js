const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

class EmailController {
  static async sendAdminEmail(req, res) {
    return EmailController._send(req, res, 'admin');
  }

  static async sendSupportEmail(req, res) {
    return EmailController._send(req, res, 'support');
  }

  static async sendAccountEmail(req, res) {
    return EmailController._send(req, res, 'account');
  }

  static async sendCeoEmail(req, res) {
    return EmailController._send(req, res, 'ceo');
  }

  static async _send(req, res, namespace) {
    const { to, subject, text, html } = req.body;
    const clientId = req.client.clientId;

    logger.info(`Email send request received [namespace: ${namespace}] from client ${clientId} to recipient ${to}`);

    if (!to || (!text && !html)) {
      logger.warn(`Email send validation failed for client ${clientId} [${namespace}]: Missing recipient or content`);
      return res.status(400).json({ error: 'Recipient "to" and message content (text or html) are required' });
    }

    try {
      const result = await EmailService.sendEmail({
        clientId,
        namespace,
        to,
        subject,
        text,
        html
      });
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error(`Email controller error for client ${clientId} [${namespace}]: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = EmailController;
