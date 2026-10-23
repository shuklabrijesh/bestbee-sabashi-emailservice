require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
  refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10),
  zoho: {
    email: process.env.ZOHO_EMAIL || '',
    password: process.env.ZOHO_PASSWORD || '',
    smtpHost: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    smtpPort: parseInt(process.env.ZOHO_SMTP_PORT || '587', 10),
    clientId: process.env.ZOHO_CLIENT_ID || '',
    clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || ''
  },
  grok: {
    authToken: process.env.NGROK_AUTH_TOKEN || '',
    subdomain: process.env.NGROK_SUBDOMAIN || ''
  }
};
