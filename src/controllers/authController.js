const crypto = require('crypto');
const AuthService = require('../services/authService');
const db = require('../database/db');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthController {
  static async login(req, res) {
    const { clientId, clientSecret } = req.body;
    logger.info(`Login attempt received for client: ${clientId}`);

    if (!clientId || !clientSecret) {
      logger.warn('Login validation failed: Missing clientId or clientSecret');
      return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    db.get(`SELECT * FROM clients WHERE client_id = ? AND status = 'active'`, [clientId], async (err, client) => {
      if (err || !client) {
        logger.warn(`Login failed: Client ${clientId} not found or inactive`);
        return res.status(401).json({ error: 'Invalid client credentials or inactive account' });
      }

      const match = await AuthService.verifySecret(clientSecret, client.client_secret_hash);
      if (!match) {
        logger.warn(`Login failed: Invalid secret provided for client ${clientId}`);
        return res.status(401).json({ error: 'Invalid client credentials' });
      }

      const accessToken = AuthService.generateAccessToken({ clientId: client.client_id, name: client.name });
      const refreshToken = AuthService.generateRefreshToken();

      const expiresAt = new Date(Date.now() + config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000).toISOString();

      db.run(
        `INSERT INTO refresh_tokens (client_id, token, expires_at) VALUES (?, ?, ?)`,
        [client.client_id, refreshToken, expiresAt],
        (err) => {
          if (err) {
            logger.error(`Database error storing refresh token for client ${clientId}: ${err.message}`);
            return res.status(500).json({ error: 'Database error generating refresh token' });
          }

          db.run(`INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
            ['LOGIN', `Client logged in: ${client.client_id}`, client.client_id]);

          logger.info(`Client successfully logged in: ${clientId}`);
          res.json({
            accessToken,
            refreshToken,
            expiresIn: config.jwtExpiresIn
          });
        }
      );
    });
  }

  static async refreshToken(req, res) {
    const { refreshToken } = req.body;
    logger.info('Token refresh request received');

    if (!refreshToken) {
      logger.warn('Token refresh validation failed: Missing refresh token');
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    db.get(`SELECT * FROM refresh_tokens WHERE token = ?`, [refreshToken], (err, row) => {
      if (err || !row) {
        logger.warn('Token refresh failed: Refresh token not found');
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      if (new Date(row.expires_at) < new Date()) {
        logger.warn(`Token refresh failed: Refresh token expired for client ${row.client_id}`);
        db.run(`DELETE FROM refresh_tokens WHERE id = ?`, [row.id]);
        return res.status(403).json({ error: 'Refresh token has expired' });
      }

      db.get(`SELECT * FROM clients WHERE client_id = ? AND status = 'active'`, [row.client_id], (err, client) => {
        if (err || !client) {
          logger.warn(`Token refresh failed: Client ${row.client_id} inactive or removed`);
          return res.status(403).json({ error: 'Client is inactive or removed' });
        }

        const accessToken = AuthService.generateAccessToken({ clientId: client.client_id, name: client.name });
        logger.info(`Access token successfully refreshed for client: ${client.client_id}`);
        res.json({ accessToken, expiresIn: config.jwtExpiresIn });
      });
    });
  }

  static async logout(req, res) {
    const { refreshToken } = req.body;
    logger.info('Logout request received');

    if (!refreshToken) {
      logger.warn('Logout validation failed: Missing refresh token');
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    db.run(`DELETE FROM refresh_tokens WHERE token = ?`, [refreshToken], function(err) {
      if (err) {
        logger.error(`Database error during logout: ${err.message}`);
        return res.status(500).json({ error: 'Database error during logout' });
      }
      logger.info('Client successfully logged out / token revoked');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }
}

module.exports = AuthController;
