const config = require('../config/config');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  trace: 3
};

class Logger {
  constructor() {
    const envLevel = (config.logLevel || 'warn').toLowerCase();
    this.currentLevel = levels[envLevel] !== undefined ? levels[envLevel] : levels.warn;
  }

  _shouldLog(level) {
    return levels[level] <= this.currentLevel;
  }

  error(message, ...args) {
    if (this._shouldLog('error')) {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this._shouldLog('warn')) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this._shouldLog('info')) {
      console.info(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }

  trace(message, ...args) {
    if (this._shouldLog('trace')) {
      console.debug(`[TRACE] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }
}

module.exports = new Logger();
