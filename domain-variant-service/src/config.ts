// Configuration management with environment variables
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  apiVersion: process.env.API_VERSION || 'v1',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  scanning: {
    timeoutMs: parseInt(process.env.SCAN_TIMEOUT_MS || '5000', 10),
    dnsTimeoutMs: parseInt(process.env.DNS_TIMEOUT_MS || '3000', 10),
    httpTimeoutMs: parseInt(process.env.HTTP_TIMEOUT_MS || '5000', 10),
  },
} as const;

export default config;
