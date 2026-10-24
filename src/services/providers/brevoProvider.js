const EmailProvider = require('./emailProvider');
const config = require('../../config/config');
const logger = require('../../utils/logger');

class BrevoProvider extends EmailProvider {
  async sendSingle(sender, recipient, subject, text, html) {
    if (!config.brevo.apiKey) {
      throw new Error('Brevo API key is not configured');
    }

    logger.trace(`Sending single email via Brevo REST API from ${sender.email} to ${recipient}`);

    const payload = {
      sender: { name: sender.name, email: sender.email },
      to: [{ email: recipient }],
      subject: subject,
      textContent: text,
      htmlContent: html
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': config.brevo.apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Brevo REST API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    return { messageId: data.messageId || 'brevo-sent' };
  }

  async sendBulk(sender, recipients, subject, text, html) {
    if (!config.brevo.apiKey) {
      throw new Error('Brevo API key is not configured');
    }

    logger.trace(`Sending bulk email via Brevo REST API from ${sender.email} to ${recipients.length} recipients`);

    const toList = recipients.map(email => ({ email }));

    const payload = {
      sender: { name: sender.name, email: sender.email },
      to: toList,
      subject: subject,
      textContent: text,
      htmlContent: html
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': config.brevo.apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Brevo bulk REST API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    return { messageId: data.messageId || 'brevo-bulk-sent' };
  }
}

module.exports = BrevoProvider;
