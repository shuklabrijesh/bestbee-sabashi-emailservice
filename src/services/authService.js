const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const db = require('../database/db');

class AuthService {
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return null;
    }
  }

  static generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  static async hashSecret(secret) {
    const saltRounds = 10;
    return await bcrypt.hash(secret, saltRounds);
  }

  static async verifySecret(secret, hash) {
    return await bcrypt.compare(secret, hash);
  }
}

module.exports = AuthService;
