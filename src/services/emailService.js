const nodemailer = require('nodemailer');
const config = require('../config/config');
const db = require('../database/db');
const logger = require('../utils/logger');

// Mapping of namespace prefixes to their respective Zoho sender emails
const SENDER_MAPPING = {
  admin: 'admin.bestbee@bestbee-sabashi.online',
  support: 'support.bestbee@bestbee-sabashi.online',
  account: 'account.bestbee@bestbee-sabashi.online',
  ceo: 'shashishukla@bestbee-sabashi.online'
};

class EmailService {
  static async getTransporterForNamespace(namespace) {
    const senderEmail = SENDER_MAPPING[namespace] || config.zoho.email;
    logger.trace(`Resolving SMTP configuration for namespace "${namespace}" -> sender: ${senderEmail}`);

    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM smtp_configs WHERE email = ?', [senderEmail], (err, row) => {
        if (err || !row) {
          logger.warn(`No specific DB SMTP config found for ${senderEmail}, falling back to environment config.`);
          const transporter = nodemailer.createTransport({
            host: config.zoho.smtpHost,
            port: config.zoho.smtpPort,
            secure: config.zoho.smtpPort === 465,
            auth: {
              user: senderEmail || config.zoho.email,
              pass: config.zoho.password
            }
          });
          return resolve({ transporter, sender: senderEmail || config.zoho.email });
        }

        logger.trace(`Using SMTP configuration from database for ${row.email}`);
        const transporter = nodemailer.createTransport({
          host: row.host,
          port: row.port,
          secure: row.port === 465,
          auth: {
            user: row.email,
            pass: row.password
          }
        });
        resolve({ transporter, sender: row.email });
      });
    });
  }

  static async sendEmail({ clientId, namespace, to, subject, text, html }) {
    logger.info(`Attempting to send email for client ${clientId} via namespace [${namespace}] to ${to}`);
    try {
      const { transporter, sender: resolvedSender } = await EmailService.getTransporterForNamespace(namespace);
      const mailOptions = {
        from: resolvedSender,
        to,
        subject,
        text,
        html
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email successfully sent from ${resolvedSender} to ${to} for client ${clientId}. MessageId: ${info.messageId}`);

      // Log success
      db.run(
        `INSERT INTO email_logs (client_id, sender, recipient, subject, status) VALUES (?, ?, ?, ?, ?)`,
        [clientId, resolvedSender, to, subject, 'SUCCESS']
      );

      return { success: true, sender: resolvedSender, messageId: info.messageId };
    } catch (error) {
      const failedSender = SENDER_MAPPING[namespace] || config.zoho.email;
      logger.error(`Failed to send email for client ${clientId} via [${namespace}] to ${to}: ${error.message}`);

      // Log failure
      db.run(
        `INSERT INTO email_logs (client_id, sender, recipient, subject, status, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
        [clientId, failedSender, to, subject, 'FAILED', error.message]
      );

      throw error;
    }
  }
}

module.exports = EmailService;
