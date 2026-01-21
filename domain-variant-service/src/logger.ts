// Structured logging with Winston
import winston from 'winston';
import { config } from './config';

const logLevel = config.nodeEnv === 'production' ? 'info' : 'debug';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Only include stack traces in development
    winston.format.errors({ stack: config.nodeEnv === 'development' }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'domain-variant-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
            const { level, message, timestamp, ...metadata } = info;
            let msg = `${timestamp || new Date().toISOString()} [${level}]: ${message}`;
            // Filter out default metadata we don't want to display
            const filteredMeta = { ...metadata };
            delete filteredMeta.service;
            if (Object.keys(filteredMeta).length > 0) {
              msg += ` ${JSON.stringify(filteredMeta)}`;
            }
            return msg;
          })
      ),
    }),
  ],
});

export default logger;
