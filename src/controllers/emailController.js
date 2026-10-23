const EmailService = require('../services/emailService');

class EmailController {
  static async send(req, res) {
    const { sender, to, subject, text, html } = req.body;
    const clientId = req.client.clientId;

    if (!to || (!text && !html)) {
      return res.status(400).json({ error: 'Recipient "to" and message content (text or html) are required' });
    }

    try {
      const result = await EmailService.sendEmail({
        clientId,
        sender,
        to,
        subject,
        text,
        html
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = EmailController;
