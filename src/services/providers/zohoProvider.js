const EmailProvider = require('./emailProvider');
const nodemailer = require('nodemailer');
const config = require('../../config/config');
const db = require('../../database/db');
const logger = require('../../utils/logger');

class ZohoProvider extends EmailProvider {
  async _getTransporter(sender) {
    return new Promise((resolve) => {
      db.get('SELECT * FROM smtp_configs WHERE email = ?', [sender.email], (err, row) => {
        const passwordToUse = row ? row.password : sender.password;

        const transporter = nodemailer.createTransport({
          host: config.zoho.smtpHost,
          port: config.zoho.smtpPort,
          secure: config.zoho.smtpPort === 465,
          auth: {
            user: sender.email,
            pass: passwordToUse
          }
        });
        resolve(transporter);
      });
    });
  }

  async sendSingle(sender, recipient, subject, text, html) {
    logger.trace(`Sending single email via Zoho fallback from ${sender.email} to ${recipient}`);
    const transporter = await this._getTransporter(sender);

    const info = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: recipient,
      subject,
      text,
      html
    });

    return { messageId: info.messageId };
  }

  async sendBulk(sender, recipients, subject, text, html) {
    logger.trace(`Sending bulk email via Zoho fallback from ${sender.email} to ${recipients.length} recipients`);
    const transporter = await this._getTransporter(sender);

    // Send individually or BCC for bulk fallback
    const info = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      bcc: recipients,
      subject,
      text,
      html
    });

    return { messageId: info.messageId };
  }
}

module.exports = ZohoProvider;
