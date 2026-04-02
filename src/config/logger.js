/**
 * Winston Logger Configuration
 *
 * WHY two transports (Console + File):
 * - Console: Colorized output for developers during local development
 * - File (error.log): Only errors — easy to tail in production alerts
 * - File (combined.log): Everything — used for audit analysis
 *
 * RULE: NEVER log passwords, tokens, card numbers, or PII in any log.
 * This is a GDPR + PCI-DSS requirement.
 */
'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize, printf, errors } = format;
const path = require('path');
const fs = require('fs');

const env = require('./env');

// Ensure logs/ directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Human-readable format for development console
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Structured JSON format for production / file transport
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: prodFormat,
  transports: [
    // Error-only log file
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    // All levels log file
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
});

// In development, also log colorized output to console
if (env.isDev) {
  logger.add(
    new transports.Console({
      format: devFormat,
    })
  );
} else {
  logger.add(
    new transports.Console({
      format: prodFormat,
    })
  );
}

module.exports = logger;
