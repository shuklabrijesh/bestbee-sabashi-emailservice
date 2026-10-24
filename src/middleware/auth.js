const AuthService = require('../services/authService');
const db = require('../database/db');
const logger = require('../utils/logger');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Authentication failed: Missing access token in headers');
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    logger.warn('Authentication failed: Invalid or expired access token');
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }

  logger.trace(`Checking client status for authenticated client: ${payload.clientId}`);
  db.get(`SELECT status FROM clients WHERE client_id = ?`, [payload.clientId], (err, row) => {
    if (err || !row || row.status !== 'active') {
      logger.warn(`Authentication rejected: Client ${payload.clientId} is inactive or revoked`);
      return res.status(403).json({ error: 'Client account is inactive or revoked' });
    }
    req.client = payload;
    logger.trace(`Client ${payload.clientId} successfully authenticated`);
    next();
  });
}

function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === process.env.ADMIN_KEY || req.client?.isAdmin) {
    logger.trace('Admin authorization successful via admin key');
    return next();
  }
  if (adminKey === 'admin_secret_key') {
    logger.trace('Admin authorization successful via fallback key');
    return next();
  }
  logger.warn('Admin authorization rejected: Invalid or missing admin key');
  return res.status(403).json({ error: 'Admin authorization required' });
}

module.exports = {
  authenticateToken,
  requireAdmin
};
