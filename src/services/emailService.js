const BrevoProvider = require('./providers/brevoProvider');
const ZohoProvider = require('./providers/zohoProvider');
const config = require('../config/config');
const db = require('../database/db');
const logger = require('../utils/logger');

const SENDER_MAP = {
  admin: config.zoho.senders.admin,
  support: config.zoho.senders.support,
  account: config.zoho.senders.account,
  ceo: config.zoho.senders.ceo
};

class EmailService {
  constructor() {
    this.brevoProvider = new BrevoProvider();
    this.zohoProvider = new ZohoProvider();
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  cleanAndValidateRecipients(recipientsInput) {
    let recipients = [];
    if (Array.isArray(recipientsInput)) {
      recipients = recipientsInput;
    } else if (typeof recipientsInput === 'string') {
      recipients = recipientsInput.split(',').map(r => r.trim());
    } else {
      return { valid: [], invalid: [] };
    }

    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];
    const valid = [];
    const invalid = [];

    for (const email of uniqueRecipients) {
      if (this.validateEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    }

    return { valid, invalid };
  }

  resolveSender(namespace) {
    const sender = SENDER_MAP[namespace];
    if (!sender || !sender.email) {
      logger.error(`Sender configuration issue: Invalid or missing sender for namespace "${namespace}"`);
      throw new Error(`Invalid sender configuration for namespace: ${namespace}`);
    }
    return sender;
  }

  async sendEmail({ clientId, endpoint, namespace, recipientsInput, subject, text, html }) {
    const sender = this.resolveSender(namespace);
    const tenant = sender.email;

    const { valid: recipients, invalid } = this.cleanAndValidateRecipients(recipientsInput);

    if (invalid.length > 0) {
      logger.warn(`Invalid email formats detected for client ${clientId}: ${invalid.join(', ')}`);
    }

    if (recipients.length === 0) {
      throw new Error('No valid recipient email addresses provided');
    }

    if (recipients.length > config.maxBulkRecipients) {
      throw new Error(`Recipient count (${recipients.length}) exceeds maximum limit of ${config.maxBulkRecipients}`);
    }

    const isBulk = recipients.length > 1;
    logger.info(`Processing ${isBulk ? 'bulk' : 'single'} email for client ${clientId} via [${namespace}] (${tenant}) to ${recipients.length} recipients`);

    let providerUsed = 'Brevo';
    let fallbackUsed = 0;
    let brevoFailureReason = null;
    let status = 'SUCCESS';
    let errorMessage = null;
    let messageId = null;

    try {
      if (isBulk) {
        const res = await this.brevoProvider.sendBulk(sender, recipients, subject, text, html);
        messageId = res.messageId;
      } else {
        const res = await this.brevoProvider.sendSingle(sender, recipients[0], subject, text, html);
        messageId = res.messageId;
      }
      logger.info(`Email successfully delivered via Brevo for client ${clientId}`);
    } catch (brevoError) {
      brevoFailureReason = brevoError.message;
      logger.warn(`Brevo delivery failed for client ${clientId}: ${brevoFailureReason}. Switching to Zoho Mail fallback.`);

      fallbackUsed = 1;
      providerUsed = 'Zoho';

      try {
        if (isBulk) {
          const res = await this.zohoProvider.sendBulk(sender, recipients, subject, text, html);
          messageId = res.messageId;
        } else {
          const res = await this.zohoProvider.sendSingle(sender, recipients[0], subject, text, html);
          messageId = res.messageId;
        }
        logger.info(`Email successfully delivered via Zoho fallback for client ${clientId}`);
      } catch (zohoError) {
        status = 'FAILED';
        errorMessage = `Brevo failed: ${brevoFailureReason} | Zoho fallback failed: ${zohoError.message}`;
        logger.error(`Complete email delivery failure for client ${clientId}: ${errorMessage}`);
      }
    }

    // Audit Trail Storage (supporting both old 'recipient' and new 'recipients' columns)
    const recipientStr = recipients.join(', ');
    db.run(
      `INSERT INTO email_logs (client_id, endpoint, tenant, sender, recipient, recipients, subject, provider_used, fallback_used, brevo_failure_reason, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, endpoint, tenant, sender.email, recipients[0], recipientStr, subject, providerUsed, fallbackUsed, brevoFailureReason, status, errorMessage],
      (err) => {
        if (err) {
          // Fallback insert if columns differ
          db.run(
            `INSERT INTO email_logs (client_id, sender, recipient, subject, status, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
            [clientId, sender.email, recipientStr, subject, status, errorMessage]
          );
        }
      }
    );

    if (status === 'FAILED') {
      throw new Error(errorMessage);
    }

    return {
      success: true,
      providerUsed,
      fallbackUsed: fallbackUsed === 1,
      recipientCount: recipients.length,
      messageId
    };
  }
}

module.exports = new EmailService();
