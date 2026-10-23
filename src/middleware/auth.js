const AuthService = require('../services/authService');
const db = require('../database/db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }

  // Check if client is still active
  db.get(`SELECT status FROM clients WHERE client_id = ?`, [payload.clientId], (err, row) => {
    if (err || !row || row.status !== 'active') {
      return res.status(403).json({ error: 'Client account is inactive or revoked' });
    }
    req.client = payload;
    next();
  });
}

function requireAdmin(req, res, next) {
  // For demonstration, admin routes can check an admin header or role
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === process.env.ADMIN_KEY || req.client?.isAdmin) {
    return next();
  }
  // Alternatively allow direct admin API access for MVP setup if header matches or test key provided
  if (adminKey === 'admin_secret_key') {
    return next();
  }
  return res.status(403).json({ error: 'Admin authorization required' });
}

module.exports = {
  authenticateToken,
  requireAdmin
};
