const crypto = require('crypto');
const AuthService = require('../services/authService');
const db = require('../database/db');
const config = require('../config/config');

class AuthController {
  static async login(req, res) {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    db.get(`SELECT * FROM clients WHERE client_id = ? AND status = 'active'`, [clientId], async (err, client) => {
      if (err || !client) {
        return res.status(401).json({ error: 'Invalid client credentials or inactive account' });
      }

      const match = await AuthService.verifySecret(clientSecret, client.client_secret_hash);
      if (!match) {
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
            return res.status(500).json({ error: 'Database error generating refresh token' });
          }

          db.run(`INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
            ['LOGIN', `Client logged in: ${client.client_id}`, client.client_id]);

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

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    db.get(`SELECT * FROM refresh_tokens WHERE token = ?`, [refreshToken], (err, row) => {
      if (err || !row) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      if (new Date(row.expires_at) < new Date()) {
        db.run(`DELETE FROM refresh_tokens WHERE id = ?`, [row.id]);
        return res.status(403).json({ error: 'Refresh token has expired' });
      }

      db.get(`SELECT * FROM clients WHERE client_id = ? AND status = 'active'`, [row.client_id], (err, client) => {
        if (err || !client) {
          return res.status(403).json({ error: 'Client is inactive or removed' });
        }

        const accessToken = AuthService.generateAccessToken({ clientId: client.client_id, name: client.name });
        res.json({ accessToken, expiresIn: config.jwtExpiresIn });
      });
    });
  }

  static async logout(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    db.run(`DELETE FROM refresh_tokens WHERE token = ?`, [refreshToken], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error during logout' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }
}

module.exports = AuthController;
