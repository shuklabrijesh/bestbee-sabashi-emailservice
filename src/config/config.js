require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  logLevel: process.env.APP_LOG_LEVEL || 'warn',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
  refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10),
  maxBulkRecipients: parseInt(process.env.MAX_BULK_RECIPIENTS || '100', 10),
  brevo: {
    apiKey: process.env.BREVO_API_KEY || ''
  },
  zoho: {
    smtpHost: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    smtpPort: parseInt(process.env.ZOHO_SMTP_PORT || '587', 10),
    senders: {
      admin: {
        email: process.env.ZOHO_ADMIN_EMAIL || 'admin@bestbee-sabashi.online',
        name: 'Admin BestBee',
        password: process.env.ZOHO_ADMIN_PASSWORD || process.env.ZOHO_PASSWORD || ''
      },
      support: {
        email: process.env.ZOHO_SUPPORT_EMAIL || 'support@bestbee-sabashi.online',
        name: 'Support BestBee',
        password: process.env.ZOHO_SUPPORT_PASSWORD || process.env.ZOHO_PASSWORD || ''
      },
      account: {
        email: process.env.ZOHO_ACCOUNT_EMAIL || 'account@bestbee-sabashi.online',
        name: 'Account BestBee',
        password: process.env.ZOHO_ACCOUNT_PASSWORD || process.env.ZOHO_PASSWORD || ''
      },
      ceo: {
        email: process.env.ZOHO_CEO_EMAIL || 'shashishukla@bestbee-sabashi.online',
        name: 'Shashi Shukla',
        password: process.env.ZOHO_CEO_PASSWORD || process.env.ZOHO_PASSWORD || ''
      }
    }
  },
  grok: {
    authToken: process.env.NGROK_AUTH_TOKEN || '',
    subdomain: process.env.NGROK_SUBDOMAIN || ''
  }
};
