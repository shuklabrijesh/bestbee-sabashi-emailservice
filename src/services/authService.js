const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthService {
  static generateAccessToken(payload) {
    logger.trace(`Generating access token for client: ${payload.clientId}`);
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  }

  static verifyAccessToken(token) {
    try {
      logger.trace('Verifying access token');
      return jwt.verify(token, config.jwtSecret);
    } catch (err) {
      logger.warn(`Access token verification failed: ${err.message}`);
      return null;
    }
  }

  static generateRefreshToken() {
    logger.trace('Generating refresh token');
    return crypto.randomBytes(40).toString('hex');
  }

  static async hashSecret(secret) {
    logger.trace('Hashing client secret');
    const saltRounds = 10;
    return await bcrypt.hash(secret, saltRounds);
  }

  static async verifySecret(secret, hash) {
    logger.trace('Verifying client secret hash');
    return await bcrypt.compare(secret, hash);
  }
}

module.exports = AuthService;
