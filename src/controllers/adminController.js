const AuthService = require('../services/authService');
const db = require('../database/db');
const crypto = require('crypto');

class AdminController {
  static async createClient(req, res) {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const clientId = 'client_' + crypto.randomBytes(8).toString('hex');
    const clientSecret = crypto.randomBytes(24).toString('hex');
    const clientSecretHash = await AuthService.hashSecret(clientSecret);

    db.run(
      `INSERT INTO clients (id, name, client_id, client_secret_hash) VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), name, clientId, clientSecretHash],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error creating client' });
        }

        db.run(`INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
          ['CREATE_CLIENT', `Created client: ${clientId} (${name})`, 'admin']);

        // Return secret only once
        res.status(201).json({
          message: 'Client created successfully. Save clientSecret securely as it will not be shown again.',
          clientId,
          clientSecret,
          name
        });
      }
    );
  }

  static async disableClient(req, res) {
    const { clientId } = req.params;
    db.run(`UPDATE clients SET status = 'disabled' WHERE client_id = ?`, [clientId], function (err) {
      if (err || this.changes === 0) {
        return res.status(404).json({ error: 'Client not found or already disabled' });
      }

      db.run(`DELETE FROM refresh_tokens WHERE client_id = ?`, [clientId]);
      db.run(`INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
        ['DISABLE_CLIENT', `Disabled client: ${clientId}`, 'admin']);

      res.json({ success: true, message: `Client ${clientId} disabled successfully` });
    });
  }

  static async getEmailLogs(req, res) {
    db.all(`SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error fetching email logs' });
      }
      res.json(rows);
    });
  }

  static async getDeliveryFailures(req, res) {
    db.all(`SELECT * FROM email_logs WHERE status = 'FAILED' ORDER BY sent_at DESC LIMIT 100`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error fetching delivery failures' });
      }
      res.json(rows);
    });
  }

  static async configureSmtp(req, res) {
    const { email, password, host, port, isDefault } = req.body;
    if (!email || !host || !port) {
      return res.status(400).json({ error: 'Email, host, and port are required' });
    }

    if (isDefault) {
      db.run(`UPDATE smtp_configs SET is_default = 0`);
    }

    db.run(
      `INSERT INTO smtp_configs (email, password, host, port, is_default)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET password=excluded.password, host=excluded.host, port=excluded.port, is_default=excluded.is_default`,
      [email, password, host, port, isDefault ? 1 : 0],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error configuring SMTP' });
        }

        db.run(`INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
          ['CONFIGURE_SMTP', `Configured SMTP for: ${email}`, 'admin']);

        res.json({ success: true, message: `SMTP configuration saved for ${email}` });
      }
    );
  }

  static async revokeClientTokens(req, res) {
    const { clientId } = req.params;
    db.run(`DELETE FROM refresh_tokens WHERE client_id = ?`, [clientId], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error revoking tokens' });
      }

      db.run(`INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
        ['REVOKE_TOKENS', `Revoked all tokens for client: ${clientId}`, 'admin']);

      res.json({ success: true, message: `All refresh tokens revoked for client ${clientId}` });
    });
  }

  static async getAuditLogs(req, res) {
    db.all(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error fetching audit logs' });
      }
      res.json(rows);
    });
  }

  static async getUsageStats(req, res) {
    db.get(`SELECT COUNT(*) as totalEmails, SUM(CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END) as successful, SUM(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) as failed FROM email_logs`, [], (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error fetching stats' });
      }
      db.get(`SELECT COUNT(*) as totalClients FROM clients`, [], (err, clientStats) => {
        res.json({
          ...stats,
          totalClients: clientStats?.totalClients || 0
        });
      });
    });
  }
}

module.exports = AdminController;
