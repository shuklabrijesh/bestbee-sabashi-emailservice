const nodemailer = require('nodemailer');
const config = require('../config/config');
const db = require('../database/db');

class EmailService {
  static async getTransporter(senderEmail = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM smtp_configs WHERE is_default = 1';
      let params = [];

      if (senderEmail) {
        query = 'SELECT * FROM smtp_configs WHERE email = ?';
        params = [senderEmail];
      }

      db.get(query, params, (err, row) => {
        if (err || !row) {
          // Fallback to env config
          const transporter = nodemailer.createTransport({
            host: config.zoho.smtpHost,
            port: config.zoho.smtpPort,
            secure: config.zoho.smtpPort === 465, // true for 465, false for other ports
            auth: {
              user: config.zoho.email,
              pass: config.zoho.password
            }
          });
          return resolve({ transporter, sender: config.zoho.email });
        }

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

  static async sendEmail({ clientId, sender, to, subject, text, html }) {
    try {
      const { transporter, sender: resolvedSender } = await EmailService.getTransporter(sender);
      const mailOptions = {
        from: resolvedSender,
        to,
        subject,
        text,
        html
      };

      const info = await transporter.sendMail(mailOptions);

      // Log success
      db.run(
        `INSERT INTO email_logs (client_id, sender, recipient, subject, status) VALUES (?, ?, ?, ?, ?)`,
        [clientId, resolvedSender, to, subject, 'SUCCESS']
      );

      return { success: true, messageId: info.messageId };
    } catch (error) {
      // Log failure
      db.run(
        `INSERT INTO email_logs (client_id, sender, recipient, subject, status, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
        [clientId, sender || config.zoho.email, to, subject, 'FAILED', error.message]
      );

      throw error;
    }
  }
}

module.exports = EmailService;
