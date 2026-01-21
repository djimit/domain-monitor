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
        winston.format.printf(
          ({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
              msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
          }
        )
      ),
    }),
  ],
});

export default logger;
