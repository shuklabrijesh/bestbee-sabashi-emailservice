const logger = require('../../utils/logger');

class EmailProvider {
  async sendSingle(sender, recipient, subject, text, html) {
    throw new Error('Method not implemented');
  }

  async sendBulk(sender, recipients, subject, text, html) {
    throw new Error('Method not implemented');
  }
}

module.exports = EmailProvider;
